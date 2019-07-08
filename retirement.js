'use strict'

/*******************************************************************************
 ********************** User data.
 ******************************************************************************/

let retirementYear = 2021

// Starting values of all of the customer's savings.
let jointTaxableSavings       = 123456.78
let jointCashSavings          = 1234.56
let spouse1TaxDeferredSavings = 1234567.89
let spouse1TaxFreeSavings     = 12345.67
let spouse2TaxDeferredSavings = 1234567.89
let spouse2TaxFreeSavings     = 12345.67

let annualContribution    = 10000
let currentAnnualExpenses = 50000

let spouse1_DOB = 1960, spouse1_LifeExpectancy = 90
let spouse2_DOB = 1960, spouse2_LifeExpectancy = 90

// These are our Social Security benefit predictions for ages 62, 67, and 70.
// Currently using values that were calculated if we retire in 2019.
let spouse1_SS62 = 1000, spouse1_SS67 = 1500, spouse1_SS70 = 2000
let spouse2_SS62 = 1000, spouse2_SS67 = 1500, spouse2_SS70 = 2000

/*******************************************************************************
 ********************** Input variables with reasonable defaults.
 ******************************************************************************/

let curYear = 2019

/* Earnings rates for various types of investment accounts.
 * Each represents a percent amount. */
let earningsRateChecking = 0.1
let earningsRateSavings  = 0.5
let earningsRateCD       = 1.0
let earningsRateBonds    = 2.0
let earningsRateStocks   = 6.0

let savingsInterestRate = 5.0
let inflationRate       = 3.0
let COLA                = 2.0

let annualPerPersonMedIns = 12000

// 2019:
//    Part B         : $135.50/month : $1,626.00/year
//    Medigap Plan B : $449.00/month : $5,388.00/year
//    TOTAL          : $584.50/month : $7,014.00/year
let annualPerPersonMedicare = 7500

/*******************************************************************************
 ********************** Utility functions.
 ******************************************************************************/

/*******************************************************************************
 * Simple utility functions that return the year the oldest person was born and
 * the year the last person is predicted to die.  This range essentially
 * represents all of the years that we need to process.
 ******************************************************************************/
function getFirstYear(person1_DOB, person2_DOB) {
	let firstYear = person1_DOB
	if(person1_DOB > person2_DOB) {
		firstYear = person2_DOB
	}
	return firstYear
}

function getLastYear(person1_DOB, person1_LifeExpectancy,
                     person2_DOB, person2_LifeExpectancy) {
	let person1_DeathYear = person1_DOB + person1_LifeExpectancy
	let person2_DeathYear = person2_DOB + person2_LifeExpectancy
	let lastYear = person1_DeathYear
	if(person1_DeathYear < person2_DeathYear) {
		lastYear = person2_DeathYear
	}
	return lastYear
}

/*******************************************************************************
 * Return the earnings for an account.
 ******************************************************************************/
function earningsOneAccount(balance, allocationStocks, allocationBonds) {
}

/*******************************************************************************
 * Return the current total savings amount.
 ******************************************************************************/
function totalSavingsInit(savingsInfo) {
	let savingsMap = savingsInfo
	function calcTotalSavings() {

		return savingsMap.get(jointCashSavings) +
		       savingsMap.get(jointTaxableSavings) +
		       savingsMap.get(spouse1TaxDeferredSavings) +
		       savingsMap.get(spouse1TaxFreeSavings) +
		       savingsMap.get(spouse2TaxDeferredSavings) +
		       savingsMap.get(spouse2TaxFreeSavings)
	}
	return calcTotalSavings
}

/*******************************************************************************
 ********************** Processing functions.
 ******************************************************************************/

/*******************************************************************************
 * Return the Social Security benefit for the specified year.
 ******************************************************************************/
function ssaBenefitInit(personDOB, personLifeExpectancy,
                        person_62, person_67, person_70,
                        spouseDOB, spouseLifeExpectancy,
                        spouse_62, spouse_67, spouse_70) {
	let data = {}

	{
		/* Set firstYear and lastYear to the entire span of time that
		 * either spouse is alive. */
		let firstYear = getFirstYear(personDOB, spouseDOB)
		let lastYear  = getLastYear(personDOB, personLifeExpectancy,
		                            spouseDOB, spouseLifeExpectancy)

		let personDeathYear = personDOB + personLifeExpectancy

		let firstSSYear = personDOB + 70
		let firstSpousalYear    = 9999
		let firstSurvivorYear   = 9999

		/* These are benefit amounts for different periods in their
		 * retirement. */
		let annualBenefit         = (person_70 * 12)
		let annualSpousalBenefit  = 0
		let annualSurvivorBenefit = 0

		/* Figure out if this person will want to use the spousal
		 * benefit.  If so, set the proper variables to handle it. */
		if(person_70 < (spouse_70 / 2)) {
			firstSSYear = personDOB + 62
			firstSpousalYear    = spouseDOB + 70
			firstSurvivorYear   = spouseDOB + spouseLifeExpectancy

			annualBenefit = person_62 * 12

			annualSpousalBenefit  = (spouse_70 * 12) / 2
			annualSurvivorBenefit = (spouse_70 * 12)
		}

		for(let year = firstYear; year < lastYear; year++) {
			if(year >= personDeathYear) {
				data[year] = 0
			}
			else if (year >= firstSurvivorYear) {
				data[year] = annualSurvivorBenefit
			}
			else if(year >= firstSpousalYear) {
				data[year] = annualSpousalBenefit
			}
			else if(year >= firstSSYear) {
				data[year] = annualBenefit
			}
			else {
				data[year] = 0
			}

			if(year > curYear) {
				annualBenefit += annualBenefit * COLA
				annualBenefit = Math.round(annualBenefit * 100)
				annualBenefit /= 100

				annualSpousalBenefit += annualSpousalBenefit * COLA
				annualSpousalBenefit = Math.round(annualSpousalBenefit * 100)
				annualSpousalBenefit /= 100

				annualSurvivorBenefit += annualSurvivorBenefit * COLA
				annualSurvivorBenefit = Math.round(annualSurvivorBenefit * 100)
				annualSurvivorBenefit /= 100
			}
		}
	}

	function ssaCalc(year) {
		return data[year]
	}
	return ssaCalc
}

/*******************************************************************************
 * Return the medical insurance or Medicare cost for the specified year.  The
 * pattern looks like this:
 * 1. Both spouses using regular medical insurance
 * 2. One spouse using regular medical insurance and one spouse using Medicare.
 * 3. Both spouses using Medicare.
 * 4. One spouse using Medicare and one spouse dead.
 * 5. Both spouses dead.
 *
 * Each year the costs are adjusted for inflation.
 *
 * Note that we might need to skip one or more of the first 4 steps.
 ******************************************************************************/
function medicalExpensesInit(personDOB, personLifeExpectancy,
                             spouseDOB, spouseLifeExpectancy,
                             retirementYear) {

	let data = {}

	{
		let firstYear = getFirstYear(personDOB, spouseDOB)
		let lastYear  = getLastYear(personDOB, personLifeExpectancy,
		                            spouseDOB, spouseLifeExpectancy)

		let personDeathYear = personDOB + personLifeExpectancy
		let spouseDeathYear = spouseDOB + spouseLifeExpectancy

		for(let year = firstYear; year < lastYear; year++) {
			let amount = 0

			if(year < retirementYear) {
				amount = 0
			}

			else {
				let personAge = year - personDOB
				let personPremium = 0
				if(personAge < personLifeExpectancy) {
					if(personAge < 65) {
						personPremium = annualPerPersonMedIns
					}
					else {
						personPremium = annualPerPersonMedicare
					}
				}

				let spouseAge = year - spouseDOB
				let spousePremium = 0
				if(spouseAge < spouseLifeExpectancy) {
					if(spouseAge < 65) {
						spousePremium = annualPerPersonMedIns
					}
					else {
						spousePremium = annualPerPersonMedicare
					}
				}

				amount = personPremium + spousePremium
			}

			data[year] = amount

			if(year > curYear) {
				annualPerPersonMedIns    = Math.round((annualPerPersonMedIns   + (annualPerPersonMedIns   * inflationRate)) * 100) / 100
				annualPerPersonMedicare  = Math.round((annualPerPersonMedicare + (annualPerPersonMedicare * inflationRate)) * 100) / 100
			}
		}
	}

	function medicalExpensesCalc(year) {
		return data[year]
	}
	return medicalExpensesCalc
}

/*******************************************************************************
 * Calculate the income tax for the specified incomes.  This implementation is
 * based on the 2017 "Married Filing Jointly" rates:
 *
 * Right now it's very simple.  We simply add up all sources of income and do a
 * regular income tax calculation.  This function could be made much more
 * sophisticated by treating each type of income separately so that things like
 * dividends and long term capital gains are handled correctly.  For now, this
 * is a simple implementation.
 *
 * 2017 standard deduction for married filing jointly is $12,700.
 *      personal exemption is $4,050.
 *
 *       $0 -  $18,650 = 10%
 *  $18,651 -  $75,900 =   $1,865.00 + 15.0% of the amount over  $18,650.
 *  $75,901 - $153,100 =  $10,452.50 + 25.0% of the amount over  $75,900.
 * $153,101 - $233,350 =  $29.752.50 + 28.0% of the amount over $153,100.
 * $233,351 - $416,700 =  $52,222.50 + 33.0% of the amount over $233,350.
 * $416,701 - $470,700 = $112,728.00 + 35.0% of the amount over $416,700.
 * $470,701+           = $131,628.00 + 39.6% of the amount over $470,700.
 ******************************************************************************/
function calculateIncomeTax(income, dividends, ltCapGains, medicalExpenses) {

	let tax = 0

	// For now we'll just treat all income as income.  It's a conservative
	// first step.
	let totalIncome = income + dividends + ltCapGains + medicalExpenses

	// Subtract the personal exemptions.
	if(totalIncome > (4050 * 2)) {
		totalIncome -= (4050 * 2)
	}

	// Subtract the standard deduction.
	if(totalIncome > 12700) {
		totalIncome -= 12700
	}

	// Calculate the taxes.
	if(totalIncome <= 18650) {
		tax = totalIncome + 0.10
	}
	else if(totalIncome <= 75900) {
		tax =   1865.00 + ((totalIncome -  18650) * 0.150)
	}
	else if(totalIncome <= 153100) {
		tax =  10452.50 + ((totalIncome -  75900) * 0.250)
	}
	else if(totalIncome <= 233350) {
		tax =  29752.50 + ((totalIncome - 153100) * 0.280)
	}
	else if(totalIncome <= 416700) {
		tax =  52222.50 + ((totalIncome - 233350) * 0.330)
	}
	else if(totalIncome <= 470700) {
		tax = 112728.00 + ((totalIncome - 416700) * 0.350)
	}
	else {
		tax = 131628.00 + ((totalIncome - 470700) * 0.396)
	}

	return Math.ceil(tax)
}

/*******************************************************************************
 * Calculate the annual expenses for the household.
 *
 * We don't currently do anything fancy.  We just start with the current annual
 * expenses, and then we adjust each year for the projected inflation rate. Some
 * examples of "fancy" would be:
 * 1. As the people get older, reduce their spending to show how older Americans
 *    don't spend as much as younger people (and still adjust for inflation).
 * 2. Reduce expenses if a spouse dies.
 ******************************************************************************/
function annualExpensesInit(currentAnnualExpenses, inflationRate,
                            personDOB, personLifeExpectancy,
                            spouseDOB, spouseLifeExpectancy) {

	let data = {}

	{
		let firstYear = getFirstYear(personDOB, spouseDOB)
		let lastYear  = getLastYear(personDOB, personLifeExpectancy,
		                            spouseDOB, spouseLifeExpectancy)

		let personDeathYear = personDOB + personLifeExpectancy
		let spouseDeathYear = spouseDOB + spouseLifeExpectancy

		for(let year = firstYear; year < lastYear; year++) {
			let amount = 0

			if(year < curYear) {
				amount = 0
			}

			else {
				amount = Math.floor(currentAnnualExpenses)
				currentAnnualExpenses += Math.floor(currentAnnualExpenses * inflationRate)
			}

			data[year] = amount
		}
	}

	function annualExpensesCalc(year) {
		return data[year]
	}
	return annualExpensesCalc
}

/*******************************************************************************
 * Calculate the IRA Required Minimum Distribution (RMD) for a person.
 ******************************************************************************/
function requiredMinimumDistributionInit() {
	// The index is a person's age.
	let rmdTable = []
	rmdTable[70] = 27.4
	rmdTable[71] = 26.5
	rmdTable[72] = 25.6
	rmdTable[73] = 24.7
	rmdTable[74] = 23.8
	rmdTable[75] = 22.9
	rmdTable[76] = 22.0
	rmdTable[77] = 21.2
	rmdTable[78] = 20.3
	rmdTable[79] = 19.5

	rmdTable[80] = 18.7
	rmdTable[81] = 17.9
	rmdTable[82] = 17.1
	rmdTable[83] = 16.3
	rmdTable[84] = 15.5
	rmdTable[85] = 14.8
	rmdTable[86] = 14.1
	rmdTable[87] = 13.4
	rmdTable[88] = 12.7
	rmdTable[89] = 12.0

	rmdTable[90] = 11.4
	rmdTable[91] = 10.8
	rmdTable[92] = 10.2
	rmdTable[93] = 9.6
	rmdTable[94] = 9.1
	rmdTable[95] = 8.6
	rmdTable[96] = 8.1
	rmdTable[97] = 7.6
	rmdTable[98] = 7.1
	rmdTable[99] = 6.7

	rmdTable[100] = 6.3
	rmdTable[101] = 5.9
	rmdTable[102] = 5.5
	rmdTable[103] = 5.2
	rmdTable[104] = 4.9
	rmdTable[105] = 4.5
	rmdTable[106] = 4.2
	rmdTable[107] = 3.9
	rmdTable[108] = 3.7
	rmdTable[109] = 3.4

	rmdTable[110] = 3.1
	rmdTable[111] = 2.9
	rmdTable[112] = 2.6
	rmdTable[113] = 2.4
	rmdTable[114] = 2.1
	rmdTable[115] = 1.9

	function rmdCalc(age, amount) {
		if(age < 70) {
			rmd = 0
		}
		else if(age < 115) {
			pct = rmdTable[age] / 100
			rmd = amount * pct
		}
		else {
			pct = 1.9 / 100
			rmd = amount * pct
		}

		return rmd
	}
	return rmdCalc
}

/*******************************************************************************
 ********************** Program starts here.
 ******************************************************************************/

console.log("Starting retirement program.")

// Load the initial savings amounts into a map.  This allows us to pass the
// savings data to functions by reference.
var myMap = new Map()
myMap.set(jointCashSavings,          jointCashSavings)
myMap.set(jointTaxableSavings,       jointTaxableSavings)
myMap.set(spouse1TaxDeferredSavings, spouse1TaxDeferredSavings)
myMap.set(spouse1TaxFreeSavings,     spouse1TaxFreeSavings)
myMap.set(spouse2TaxDeferredSavings, spouse2TaxDeferredSavings)
myMap.set(spouse2TaxFreeSavings,     spouse2TaxFreeSavings)

// Convert the percentage values to decimal.
earningsRateChecking /= 100
earningsRateSavings  /= 100
earningsRateCD       /= 100
earningsRateBonds    /= 100
earningsRateStocks   /= 100

savingsInterestRate /= 100
inflationRate       /= 100
COLA                /= 100

let ssaSpouse1 = ssaBenefitInit(spouse1_DOB, spouse1_LifeExpectancy,
                                spouse1_SS62, spouse1_SS67, spouse1_SS70,
                                spouse2_DOB, spouse2_LifeExpectancy,
                                spouse2_SS62, spouse2_SS67, spouse2_SS70)
let ssaSpouse2 = ssaBenefitInit(spouse2_DOB, spouse2_LifeExpectancy,
                                spouse2_SS62, spouse2_SS67, spouse2_SS70,
                                spouse1_DOB, spouse1_LifeExpectancy,
                                spouse1_SS62, spouse1_SS67, spouse1_SS70)

let medicalExpenses = medicalExpensesInit(spouse1_DOB, spouse1_LifeExpectancy,
                                          spouse2_DOB, spouse2_LifeExpectancy,
                                          retirementYear)

let annualExpenses = annualExpensesInit(currentAnnualExpenses, inflationRate,
                                        spouse1_DOB, spouse1_LifeExpectancy,
                                        spouse2_DOB, spouse2_LifeExpectancy)

let rmd = requiredMinimumDistributionInit()

let totalSavings = totalSavingsInit(myMap)

let year = curYear

let spouse1_DeathYear = spouse1_DOB + spouse1_LifeExpectancy
let spouse2_DeathYear = spouse2_DOB + spouse2_LifeExpectancy
let deathYear = spouse1_DeathYear
if(spouse1_DeathYear < spouse2_DeathYear) {
	deathYear = spouse2_DeathYear
}

// Process the years before the retirement date.
console.log("")
console.log("          Beginning                                       Final")
console.log("           Balance        Earnings   Contribution        Balance")
while(year < retirementYear) {
	let earnings  = (totalSavings() * savingsInterestRate)
	earnings  = Math.round(earnings * 100)
	earnings /= 100

	let newBalance = totalSavings() + earnings + annualContribution

	let newBalanceString           = newBalance.toLocaleString(        'en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	let totalSavingsString         = totalSavings().toLocaleString(    'en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	let earningsString             = earnings.toLocaleString(          'en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	let annualContributionString   = annualContribution.toLocaleString('en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")

	console.log(`${year} : ${totalSavingsString} + ${earningsString} + ${annualContributionString} = ${newBalanceString}`)

	let currentJointCashSavings = myMap.get(jointCashSavings)
	currentJointCashSavings += (earnings + annualContribution)
	myMap.set(jointCashSavings, currentJointCashSavings)

	year++
}

// Process the retirement years.
console.log("")
console.log("           Beginning                      Soc Sec        Soc Sec                         Medical          Income          Final")
console.log("            Balance        Earnings      Person #1      Person #2         Expenses      Insurance          Taxes         Balance")
while(year < deathYear) {
	// Get the SS benefits.
	let ssVal1 = ssaSpouse1(year)
	let ssVal2 = ssaSpouse2(year)

	// Get the Medical/Medicare and regular expenses.
	let annualMedicalExpenses = medicalExpenses(year)
	let annualBasicExpenses = annualExpenses(year)

	let earnings = Math.round(totalSavings() * savingsInterestRate * 100) / 100

	let annualIncomeTaxes = calculateIncomeTax(annualBasicExpenses, 0, 0, annualMedicalExpenses)

	let newBalance = (totalSavings() + earnings + ssVal1 + ssVal2) - (annualBasicExpenses + annualMedicalExpenses + annualIncomeTaxes)

	let a = newBalance.toLocaleString(           'en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	let b = totalSavings().toLocaleString(       'en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	let c = earnings.toLocaleString(             'en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	let d = ssVal1.toLocaleString(               'en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	let e = ssVal2.toLocaleString(               'en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	let f = annualBasicExpenses.toLocaleString(  'en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	let g = annualMedicalExpenses.toLocaleString('en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	let h = annualIncomeTaxes.toLocaleString(    'en-US', { style : 'decimal', maximumFractionDigits : 2, minimumFractionDigits : 2}).padStart(12, " ")
	console.log(`${year} : (${b} + ${c} + ${d} + ${e}) - (${f} + ${g} + ${h}) = ${a}`)

	let prev = myMap.get(jointCashSavings)
	let adds = (earnings + ssVal1 + ssVal2)
	let subs = (annualBasicExpenses + annualMedicalExpenses + annualIncomeTaxes)
	let next = ((prev + adds) - subs)
	next  = Math.round(next * 100) / 100
	myMap.set(jointCashSavings, next)

	year++
}
