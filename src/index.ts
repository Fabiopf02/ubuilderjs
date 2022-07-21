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
    return this
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
    let currentOffset = 1

    const paginatedData = new Array(pages)

    for (let page = 0; page < pages; page++) {
      const from = page === 0 ? 0 : page * perPage
      const to = (page + 1) * perPage
      const pageData = data.slice(from, to)
      paginatedData[page] = pageData
    }

    const next = () => {
      if (currentOffset + 1 > pages) return null
      currentOffset++
      return paginatedData[currentOffset - 1]
    }
    const prev = () => {
      if (currentOffset - 1 < 1) return null
      currentOffset--
      return paginatedData[currentOffset - 1]
    }

    const offset = (index: number) => {
      if (index < 1 || index > pages) return null
      currentOffset = index
      return paginatedData[currentOffset - 1]
    }

    const first = () => {
      currentOffset = 1
      return paginatedData[currentOffset - 1]
    }

    const last = () => {
      currentOffset = pages
      return paginatedData[currentOffset - 1]
    }

    return {
      total,
      pages,
      page: currentOffset,
      data: paginatedData[currentOffset - 1],
      offset,
      prev,
      next,
      first,
      last,
    }
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

    if (this._perPage > 0) return this._pagination(orderedResults)

    return orderedResults
  }
}
