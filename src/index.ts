import { IWhereParams, Obj, WhereTypes } from './types'

export class UBuilder {
  private _database: any[] = []
  private _limit: number = 0
  private _select: string[] = []
  private _perPage: number = 0
  private _where: IWhereParams = {
    AND: {},
    OR: {},
  }
  private _orderBy: string = ''
  private _orderType: 'asc' | 'desc' = 'asc'

  constructor(database: any[]) {
    if (!database) throw new Error('Database parameter is required!')
    this._database = database
  }

  static for(database: any[]) {
    new UBuilder(database)
    return this
  }

  limit(max: number) {
    this._limit = max
    return this
  }

  select(properties: string[]) {
    this._select = properties
    return this
  }

  where(_value: IWhereParams) {
    const types: WhereTypes[] = ['AND', 'OR']
    for (const type of types) {
      if (!_value[type]) continue
      for (const [prop, selectedValue] of Object.entries(_value[type]!)) {
        const whereFilter =
          (selectedValue as any) instanceof RegExp
            ? selectedValue
            : new RegExp(selectedValue)
        const obj: any = {}
        obj[prop] = whereFilter
        Object.assign(this._where[type]!, obj)
      }
    }
    return this
  }

  orderBy(_value: string) {
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

  paginate(perPage: number = 10) {
    this._perPage = perPage
    const response = this.build()
    return this._pagination(response)
  }

  private isInLimit(results: any[]) {
    return this._limit && results.length === this._limit
  }

  private selectProperties(item: Obj) {
    if (!this._select.length) return item
    const newObject: Obj = {}
    for (const key of this._select) {
      if (item.hasOwnProperty(key)) {
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
      for (const [prop, whereFilter] of Object.entries(this._where.AND!)) {
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
      for (const [prop, whereFilter] of Object.entries(this._where.OR!)) {
        if (whereFilter.test(item[prop])) {
          matched = true
          break
        }
      }
    }
    return matched ? item : null
  }

  private order(results: any[]) {
    if (!this._orderBy.length) return results
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

    return orderedResults
  }
}
