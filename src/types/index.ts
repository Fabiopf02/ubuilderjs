export type Obj = { [key: string | number | symbol]: any }

export type WhereTypes = 'AND' | 'OR'

export interface IWhereParams {
  AND?: Obj
  OR?: Obj
}
