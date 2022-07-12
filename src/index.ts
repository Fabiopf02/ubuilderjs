import { IWhereParams, Obj, WhereTypes } from './types'
export class UBuilder {
  private _database: any[] = []
  private _limit: number = 0
  private _select: string[] = []
  private _where: IWhereParams = {
    AND: {},
    OR: {},
  }

  constructor(database: any[]) {
    if (!database) throw new Error('Database parameter is required!')
    this._database = database
  }

  static for(database: any[]) {
    new UBuilder(database)
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

  build() {
    const results = []

    for (const item of this._database) {
      const filteredItem = this.filter(item)
      if (!filteredItem) continue
      const selectedProperties = this.selectProperties(item)
      results.push(selectedProperties)

      if (this.isInLimit(results)) break
    }

    return results
  }
}
