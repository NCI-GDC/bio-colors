import 'babel-polyfill'
import * as d3 from 'd3'
import RawSvg from './raw-svg'
import colorCodes from './colorCodes'

let toClassName = key => key.split(` `).join(`-`)
let halfPixel = 0.5

export default ({
  clickHandler,
  data,
  selector,
  height,
  width,
  labelSize,
  offsetLeft = 0,
  offsetTop = 0,
  primarySiteKey = `_key`,
  caseCountKey = `_count`,
  fileCountKey = `fileCount`,
} = {}) => {
  // Similar to a React target element
  let root = document.querySelector(selector)

  if (!root) throw `Must select an existing element!`

  root.innerHTML = RawSvg()

  width = width || 400
  height = height || 520
  labelSize = labelSize || `12px`

  let plotHeight = height - 20
  let barStartOffset = 110
  let barWidth = width - barStartOffset
  let maxCases = Math.max(...data.map(d => d[caseCountKey]))
  let tickInterval = 500
  let numberOfVerticalAxis = Math.floor(maxCases / tickInterval) + 1

  // The Bar Chart
  let svg = d3
    .select(selector)
    .append(`svg`)
    .attr(`class`, `chart`)
    .attr(`width`, width)
    .attr(`height`, height)
    .attr(`viewBox`, `0 0 ${width} ${height}`)
    .append(`g`)

  let colorScale = d3.scaleOrdinal(d3.schemeCategory20)

  // Bar Heights
  let y = d3
    .scaleBand()
    .domain(data.map(x => x[primarySiteKey]))
    .range([plotHeight, 0])

  // Bar Widths
  let x = d3
    .scaleLinear()
    .domain([0, maxCases])
    .range([0, barWidth])

  // Horizontal Axis
  svg
    .append(`line`)
    .attr(`stroke`, `rgba(255, 255, 255, 0.8)`)
    .attr(`x1`, barStartOffset)
    .attr(`x2`, width)
    .attr(`y1`, plotHeight + halfPixel)
    .attr(`y2`, plotHeight + halfPixel)

  let xAxisLabels = svg.append(`g`).attr(`id`, `xAxisLabels`)

  // Vertical Axis
  for (let i = 0; i < numberOfVerticalAxis; i++) {
    svg
      .append(`line`)
      .attr(`stroke`, `rgba(255, 255, 255, 0.${8 - i})`)
      .attr(`x1`, (x(tickInterval) * i) + barStartOffset)
      .attr(`x2`, (x(tickInterval) * i) + barStartOffset)
      .attr(`y1`, 0)
      .attr(`y2`, plotHeight)

    if (i) { // Don't display zero
      xAxisLabels
        .append(`text`)
        .attr(`y`, plotHeight + 13)
        .attr(`x`, (x(tickInterval) * i) + barStartOffset)
        .attr(`fill`, `rgb(10, 10, 10)`)
        .attr(`font-size`, `12px`)
        .style(`text-anchor`, `middle`)
        .text(d => tickInterval * i)
      }
  }

  // Primary Site Labels
  svg
    .append(`g`)
    .attr(`id`, `primarySiteLabels`)
    .selectAll(`text`)
    .data(data)
    .enter()
    .append(`text`)
    .attr(`class`, d => `primary-site-label-${toClassName(d[primarySiteKey])}`)
    .attr(`y`, (d, i) => ((plotHeight / data.length) * i) + 14)
    .attr(`x`, barStartOffset - 10)
    .attr(`fill`, `rgb(10, 10, 10)`)
    .attr(`font-size`, labelSize)
    .style(`text-anchor`, `end`)
    .text(d => d[primarySiteKey])
    .on(`mouseover`, function (d, i) { // needs `this`
      let organSelector = toClassName(d[primarySiteKey])
      let organ = document.getElementById(organSelector)
      if (organ) organ.style.opacity = 1

      d3.select(this)
        .style(`cursor`, `pointer`)

      d3.select(`.bar-${toClassName(d[primarySiteKey])}`)
        .transition(300)
        .attr(`fill`, d => {
          let hsl = d3.hsl(d.color)
          hsl.s = 1
          hsl.l = 0.7
          return d3.hsl(hsl)
        })

      d3.select(`.primary-site-label-${toClassName(d[primarySiteKey])}`)
        .transition(300)
        .attr(`fill`, `white`)

      tooltip
        .style(`opacity`, 1)
        .html(`
          <div style="color: #bb0e3d">${d._key}</div>
          <div style="font-size: 12px; color: rgb(20, 20, 20)">
            ${d[caseCountKey]} cases (${d[fileCountKey] || 100} files)
          </div>
        `)
        .style(`left`, `${d3.event.pageX - offsetLeft}px`)
        .style(`top`, `${d3.event.pageY - offsetTop - 86}px`)
        .style(`transform`, `translateX(-50%)`)
        .style(`transform`, `translateX(-50%)`)
        .style(`z-index`, `99999`)
    })
    .on(`mouseout`, function (d, i) { // needs `this`
      let organSelector = toClassName(d[primarySiteKey])
      let organ = document.getElementById(organSelector)
      if (organ) organ.style.opacity = 0

      d3.select(`.bar-${toClassName(d[primarySiteKey])}`)
        .transition(300)
        .attr(`fill`, d => d.color)

      d3.select(`.primary-site-label-${toClassName(d[primarySiteKey])}`)
        .transition(300)
        .attr(`fill`, `rgb(20, 20, 20)`)

      tooltip.style(`opacity`, 0)
    })
    .on(`click`, clickHandler)

  // Bar Chart Tootlip
  let tooltip = d3
    .select(selector)
    .append(`div`)
    .style(`position`, `absolute`)
    .style(`opacity`, 0)
    .style(`background-color`, `white`)
    .style(`padding`, `10px`)
    .style(`box-shadow`, `0 2px 5px 0 rgba(0,0,0,0.16),0 2px 10px 0 rgba(0,0,0,0.12)`)
    .style(`border-radius`, `5px`)
    .style(`border`, `1px solid rgba(40, 40, 40)`)
    .style(`pointer-events`, `none`)

  // Horizontal Bars
  svg
    .append(`g`)
    .attr(`id`, `barGroup`)
    .selectAll(`g`)
    .data(data)
    .enter()
    .append(`g`)
    .append(`rect`)
    .attr(`class`, d => `bar-group-${toClassName(d[primarySiteKey])}`)
    .attr(`y`, (d, i) => ((plotHeight / data.length) * i) + 6)
    .attr(`x`, barStartOffset + halfPixel)
    .attr(`width`, d => x(d[caseCountKey]))
    .attr(`height`, y.bandwidth() - 6)
    .attr(`fill`, (d, i) => { d.color = colorCodes[d[primarySiteKey]]; return d.color })
    .attr(`class`, d => `bar-${toClassName(d[primarySiteKey])}`)
    .on(`mouseover`, function (d, i) { // needs `this`
      let organSelector = toClassName(d[primarySiteKey])
      let organ = document.getElementById(organSelector)
      if (organ) organ.style.opacity = 1

      d3.select(this)
        .attr(`cursor`, `pointer`)
        .transition(300)
        .attr(`fill`, d => {
          let hsl = d3.hsl(d.color)
          hsl.s = 1
          hsl.l = 0.7
          return d3.hsl(hsl)
        })

      d3.select(`.primary-site-label-${toClassName(d[primarySiteKey])}`)
        .transition(300)
        .attr(`fill`, `white`)

      tooltip
        .style(`opacity`, 1)
        .html(`
          <div style="color: #bb0e3d">${d._key}</div>
          <div style="font-size: 12px; color: rgb(20, 20, 20)">
            ${d[caseCountKey].toLocaleString()} cases, (${d[fileCountKey].toLocaleString() || 100} files)
          </div>
        `)
        .style(`left`, `${d3.event.pageX - offsetLeft}px`)
        .style(`top`, `${d3.event.pageY - offsetTop - 86}px`)
        .style(`transform`, `translateX(-50%)`)
        .style(`transform`, `translateX(-50%)`)
        .style(`z-index`, `99999`)
    })
    .on(`mouseout`, function (d, i) { // needs `this`
      let organSelector = toClassName(d[primarySiteKey])
      let organ = document.getElementById(organSelector)
      if (organ) organ.style.opacity = 0

      d3.select(this)
        .transition(300)
        .attr(`fill`, d => d.color)

      d3.select(`.primary-site-label-${toClassName(d[primarySiteKey])}`)
        .transition(300)
        .attr(`fill`, `rgb(20, 20, 20)`)

      tooltip.style(`opacity`, 0)
    })
    .on(`click`, clickHandler)

  let svgs = document.querySelectorAll(`#human-body-highlights svg`)
  ;[].forEach.call(svgs, svg => {
    svg.addEventListener(`click`, function () {
      clickHandler({ _key: this.id })
    })

    svg.addEventListener(`mouseover`, function (event) { // needs `this`
      this.style.opacity = 1

      d3.select(`.primary-site-label-${this.id}`)
        .transition(300)
        .attr(`fill`, `white`)

      d3.select(`.bar-${this.id}`)
        .attr(`cursor`, `pointer`)
        .transition(300)
        .attr(`fill`, d => {
          // hacks
          tooltip
            .style(`opacity`, 1)
            .html(`
              <div style="color: #bb0e3d">${d[primarySiteKey]}</div>
              <div style="font-size: 12px; color: rgb(20, 20, 20)">
                ${d[caseCountKey].toLocaleString()} cases (${d[fileCountKey].toLocaleString() || 100} files)
              </div>
            `)
            .style(`left`, `${event.clientX - offsetLeft}px`)
            .style(`top`, `${event.clientY - offsetTop - 86}px`)
            .style(`transform`, `translateX(-50%)`)
            .style(`z-index`, `99999`)

          let hsl = d3.hsl(d.color)
          hsl.s = 1
          hsl.l = 0.7
          return d3.hsl(hsl)
        })
    })
    svg.addEventListener(`mouseout`, function () { // needs `this`
      this.style.opacity = 0

      d3.select(`.primary-site-label-${this.id}`)
        .transition(300)
        .attr(`fill`, `rgb(20, 20, 20)`)

      d3.select(`.bar-${this.id}`)
        .transition(300)
        .attr(`fill`, d => {
          tooltip.style(`opacity`, 0)
          return d.color
        })
    })
  })
}