type Obj = { [key: string | number]: any }

export class UBuilder {
  private _database: any[] = []
  private _limit: number = 0
  private _select: string[] = []

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

  build() {
    const results = []

    for (const item of this._database) {
      results.push(this.selectProperties(item))

      if (this.isInLimit(results)) break
    }

    return results
  }
}
