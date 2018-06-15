#!/usr/bin/env node
'use strict'

const inquirer = require('inquirer')
const chalk = require('chalk')
const Table = require('cli-table')
const { join } = require('path')
const { readdirSync, readFileSync } = require('fs')
const { compare } = require('./lib/autocannon')
const { info } = require('./lib/packages')

const resultsPath = join(process.cwd(), 'results')
let choices = readdirSync(resultsPath)
  .filter((file) => file.match(/(.+)\.json$/))
  .sort()
  .map((choice) => choice.replace('.json', ''))

const showAsTable = process.argv[2] === '-t'
if (!choices.length) {
  console.log(chalk.red('Benchmark to gather some results to compare.'))
} else if (showAsTable) {
  const table = new Table({
    head: ['', 'Version', 'Router', 'Requests/s', 'Latency', 'Throughput/Mb']
  })

  const bold = (writeBold, str) => writeBold ? chalk.bold(str) : str
  choices.forEach((result) => {
    let data = readFileSync(`${resultsPath}/${result}.json`)
    data = JSON.parse(data.toString())
    const beBold = result === 'fastify'
    const { version = 'N/A', hasRouter = false } = info(result) || {}
    table.push([
      bold(beBold, chalk.blue(result)),
      bold(beBold, version),
      bold(beBold, hasRouter ? '✓' : '✗'),
      bold(beBold, data.requests.average),
      bold(beBold, data.latency.average),
      bold(beBold, (data.throughput.average / 1024 / 1024).toFixed(2))
    ])
  })

  console.log(table.toString())
} else {
  inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: 'What\'s your first pick?',
    choices
  }]).then((firstChoice) => {
    choices = choices.filter(choice => choice !== firstChoice.choice)
    inquirer.prompt([{
      type: 'list',
      name: 'choice',
      message: 'What\'s your second one?',
      choices
    }]).then((secondChoice) => {
      const [a, b] = [firstChoice.choice, secondChoice.choice]
      const result = compare(a, b)
      if (result === true) {
        console.log(chalk.green.bold(`${a} and ${b} both are fast!`))
      } else {
        const fastest = chalk.bold.yellow(result.fastest)
        const fastestAverage = chalk.green(result.fastestAverage)
        const slowest = chalk.bold.yellow(result.slowest)
        const slowestAverage = chalk.green(result.slowestAverage)
        const diff = chalk.bold.green(result.diff)

        console.log(`
 ${chalk.blue('Both are awesome but')} ${fastest} ${chalk.blue('is')} ${diff} ${chalk.blue('faster than')} ${slowest}
 • ${fastest} ${chalk.blue('request average is')} ${fastestAverage}
 • ${slowest} ${chalk.blue('request average is')} ${slowestAverage}`)
      }
    })
  })
}
