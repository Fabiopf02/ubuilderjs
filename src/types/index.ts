export type Obj<P> = Partial<P>

export type WhereTypes = 'AND' | 'OR'

export interface IWhereParams<DataType> {
  AND?: Obj<DataType>
  OR?: Obj<DataType>
}
