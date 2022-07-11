import { UBuilder } from '../src/index'

const data = [
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
})
