import { IWhereParams, Obj, WhereTypes } from './types'

export class UBuilder<DataType = any> {
  private _database: any[] = []
  private _limit: number = 0
  private _select: Array<keyof DataType> = []
  private _perPage: number = 0
  private _where: IWhereParams<DataType> = {
    AND: {},
    OR: {},
  }
  private _orderBy: keyof DataType = '' as keyof DataType
  private _orderType: 'asc' | 'desc' = 'asc'
  private _groupBy: keyof DataType = null as unknown as keyof DataType

  constructor(database: DataType[]) {
    if (!database) throw new Error('Database parameter is required!')
    this._database = database
  }

  limit(max: number) {
    this._limit = max
    return this
  }

  select(properties: Array<keyof DataType>) {
    this._select = properties
    return this
  }

  where(_value: IWhereParams<DataType>) {
    const types: WhereTypes[] = ['AND', 'OR']
    for (const type of types) {
      if (!_value[type]) continue
      for (const [prop, selectedValue] of Object.entries(_value[type]!)) {
        const whereFilter =
          (selectedValue as any) instanceof RegExp
            ? selectedValue
            : new RegExp(selectedValue as any)
        const obj = { [prop]: whereFilter }
        Object.assign(this._where[type]!, obj)
      }
    }
    return this
  }

  orderBy(_value: keyof DataType) {
    this._orderBy = _value
    return this
  }

  asc() {
    this._orderType = 'asc'
    return this
  }

  desc() {
    this._orderType = 'desc'
    return this
  }

  groupBy(key: keyof DataType) {
    this._groupBy = key
    return this
  }

  paginate(perPage: number = 10) {
    this._perPage = perPage
    const response = this.build()
    return this._pagination(response)
  }

  private isInLimit(results: any[]) {
    return this._limit && results.length === this._limit
  }

  private selectProperties(item: Obj<DataType>) {
    if (!this._select.length) return item
    const newObject: { [key: string]: any } = {}
    for (const key of this._select) {
      if (item.hasOwnProperty(key)) {
        // @ts-ignore
        newObject[key] = item[key]
      }
    }
    return newObject
  }

  private filter(item: any) {
    let matched = true
    const OR = Object.keys(this._where.OR!).length > 0
    const AND = Object.keys(this._where.AND!).length > 0
    if (!OR && !AND) return item
    if (AND) {
      for (const [prop, whereFilter] of Object.entries(
        this._where.AND! as { [key: string]: any }
      )) {
        if (whereFilter.test(item[prop])) {
          matched = true
          continue
        }
        matched = false
        break
      }
    }
    if (OR) {
      matched = false
      for (const [prop, whereFilter] of Object.entries(
        this._where.OR! as { [key: string]: any }
      )) {
        if (whereFilter.test(item[prop])) {
          matched = true
          break
        }
      }
    }
    return matched ? item : null
  }

  private order(results: any[]) {
    if (!(this._orderBy as string).length) return results
    return results.sort((a, b) => {
      const valueA = a[this._orderBy]
      const valueB = b[this._orderBy]

      if (this._orderType === 'asc') return valueA - valueB
      return valueB - valueA
    })
  }

  private _pagination(data: any[]) {
    const total = data.length
    const perPage = this._perPage
    const pages = Math.ceil(total / perPage)
    const paginatedData = new Array(pages)
    for (let page = 0; page < pages; page++) {
      const from = page === 0 ? 0 : page * perPage
      const to = (page + 1) * perPage
      const pageData = data.slice(from, to)
      paginatedData[page] = pageData
    }
    const props = {
      total,
      per_page: perPage,
      pages,
      page: 1,
      data: paginatedData[0],
      next: () => props.data,
      prev: () => props.data,
      offset: (index: number) => props.data,
      first: () => props.data,
      last: () => props.data,
    }

    const next = () => {
      if (props.page + 1 > pages) return null
      props.page++
      props.data = paginatedData[props.page - 1]
      return props.data
    }
    const prev = () => {
      if (props.page - 1 < 1) return null
      props.page--
      props.data = paginatedData[props.page - 1]
      return props.data
    }

    const offset = (index: number) => {
      if (index < 1 || index > pages) return null
      props.page = index
      props.data = paginatedData[props.page - 1]
      return props.data
    }

    const first = () => {
      props.page = 1
      props.data = paginatedData[props.page - 1]
      return props.data
    }

    const last = () => {
      props.page = pages
      props.data = paginatedData[props.page - 1]
      return props.data
    }

    Object.assign(props, { offset, prev, next, first, last })

    return props
  }

  private group(data: DataType[]) {
    const response = []
    const groupedValues: any[] = []
    for (const dataItem of data) {
      const currentGroupValue = dataItem[this._groupBy]
      const groupedByValue = data.filter(
        (item) =>
          !groupedValues.includes(currentGroupValue) &&
          item[this._groupBy] === currentGroupValue
      )
      groupedValues.push(currentGroupValue)
      response.push(groupedByValue)
    }
    return response
  }

  build() {
    const results = []

    for (const item of this._database) {
      const filteredItem = this.filter(item)
      if (!filteredItem) continue
      const selectedProperties = this.selectProperties(item)
      results.push(selectedProperties)

      if (this.isInLimit(results)) break
    }

    const orderedResults = this.order(results)

    if (this._groupBy) return this.group(orderedResults)

    return orderedResults
  }
}
