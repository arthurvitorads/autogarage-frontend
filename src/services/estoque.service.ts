export function isQuantidadeValida(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 999_999_999.999 &&
    Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000001
}
