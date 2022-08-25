# web-vitals-labs

CLI tool to find Core Web Vitals issues on the website caused by javascript.

## Intro

This CLI was created to find impact on core web vitals by js loaded from different domains. It dynamically finds all javascript files on website, group them by domain and sort by loading order.After that, it runs lighthouse multiple times for one selected url progressively blocking subsequent domain from being loaded and calculates score for each core web vital metric.

## Usage

- progressive - removing js scripts one by one from website starting from the lastly loaded one. This way we can see the impact of each script without skewing data caused by accidentally removing script’s initiator first.

  `node block-progressive.js --dynamicPatterns`

- isolated - once we have suspicious scripts we can test cwv performance by comparing results with and without script being loaded.

  `node block-isolated.js --dynamicPatterns`
