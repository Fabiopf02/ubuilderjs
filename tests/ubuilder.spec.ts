import { UBuilder } from '../src/index'

const data: { [key: string]: any }[] = [
  {
    id: 1,
    name: 'Test 1',
  },
  {
    id: 2,
    name: 'Test 2',
  },
  {
    id: 3,
    name: 'Test 3',
  },
  {
    id: 4,
    name: 'Test 4',
  },
]

describe('UBuilder', () => {
  test('Deve retornar apenas um registro', () => {
    const expected = [data[0]]
    const received = new UBuilder(data).limit(1).build()

    expect(received).toStrictEqual(expected)
  })
  test('Deve selecionar apenas uma propriedade do objeto', () => {
    const first = data[0]
    delete first['id']
    const expected = [first]
    const received = new UBuilder(data).limit(1).select(['name']).build()

    expect(received).toStrictEqual(expected)
  })
  test('Deve filtrar os valores com where', () => {
    const first = data[1]
    const expected = [first]
    const received = new UBuilder(data)
      .limit(1)
      .where({ OR: { id: 2 } })
      .build()

    expect(received).toStrictEqual(expected)
  })
  test('Deve ordenar os valores com orderBy', () => {
    const expected = data.reverse()
    const received = new UBuilder(data).orderBy('id').desc().build()
    expect(received).toStrictEqual(expected)
  })
  test('Deve paginar os dados', () => {
    const paginationResponse = new UBuilder(data).paginate(3)
    expect(paginationResponse.pages).toBe(2)
    expect(paginationResponse.total).toBe(4)
    expect(paginationResponse.page).toBe(1)
    expect(paginationResponse.first()).toHaveLength(3)
    expect(paginationResponse.last()).toHaveLength(1)
    expect(paginationResponse.offset(2)).toHaveLength(1)
    expect(paginationResponse.page).toBe(2)
    paginationResponse.first()
    expect(paginationResponse.page).toBe(1)
  })
})
