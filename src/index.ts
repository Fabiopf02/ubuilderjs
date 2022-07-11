export class UBuilder {
  private _database: any[] = []
  private _limit: number = 0

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

  private isInLimit(results: any[]) {
    return this._limit && results.length === this._limit
  }

  build() {
    const results = []

    for (const item of this._database) {
      results.push(item)

      if (this.isInLimit(results)) break
    }

    return results
  }
}
