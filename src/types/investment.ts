export interface InvestmentRecord {
  date: string
  amount_before_investment: number
  amount_after_investment: number
}

export interface InstitutionData {
  institution: string
  investments: InvestmentRecord[]
}
