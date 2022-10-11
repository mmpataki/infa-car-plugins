() => ({
    name: "kbplugin",
    handlers: {
        logview: {
            textselect: [
                {
                    menulabel: 'Search in KB',
                    handler(arg) {
                        console.log(arg)
                        window.open(`https://infa.lightning.force.com/lightning/cmp/c__INFAKBContentSearch?#q=${arg.txt}`, '_blank').focus();
                    }
                }
            ],
            infertypes: [
                function tsDetector(fields) {
                    let ts = fields.filter(f => ['ts', 'time'].filter(kw => f.name.toLowerCase().includes(kw)).length)[0]
                    if (ts) { ts.itype = 'ts'; ts.isort = 'asc' }
                }
            ],
            computeview: [
                function tsLevelMsg(fields) {
                    let picked = []
                    let patterns = [
                        { type: 'Long', kws: ['timestamp', 'ts'], ignore: [], props: { wrap: false, visible: true, decodeAs: 'date', align: 'left', stats: true } },
                        { type: 'String', kws: ['lvl', 'level'], ignore: [], props: { wrap: false, visible: true, decodeAs: 'default', align: 'left' } },
                        { type: 'String', kws: ['msg', 'message'], ignore: ['_msg'], props: { wrap: true, visible: true, decodeAs: 'default', align: 'left' } }
                    ]
                    patterns.forEach(pset => {
                        let matches = fields.filter(f => f.type == pset.type && pset.kws.filter(kw => f.name.toLowerCase().includes(kw)).length && !pset.ignore.includes(f.name))
                        if (matches.length) {
                            picked.push({ ...matches[0], ...pset.props })
                        }
                    })
                    return picked.length ? { name: picked.map(f => f.name).join('-'), fields: picked } : undefined
                }
            ],
            computecharts: [
                function tsCount(fields, comp, stats) {
                    let gap = Math.max(+(((stats.ts.max - stats.ts.min) / 100).toFixed(0)), 1)
                    let ts = fields.filter(f => ['ts', 'time'].filter(kw => f.name.toLowerCase().includes(kw)).length)[0]
                    if (!ts) return
                    return {
                        "showLegend": false,
                        "xIsDateTime": true,
                        "stackValues": false,
                        "lineWidth": 0,
                        "type": "serieschart",
                        "title": "Number of messages vs time",
                        "description": "",
                        "noDataMessage": "No data available",
                        "datastore": {
                            "query": JSON.stringify(comp.buildQuery()),
                            "pageSize": 0,
                            "mode": "facet",
                            "queriedFields": [],
                            "rangeFacets": [
                                { field: "ts", start: stats.ts.min, end: stats.ts.max + 1, gap },
                            ],
                            "type": "logs"
                        },
                        "preProcessor": "(cur, idx, state)=>({name: +cur.name, count: +cur.count})",
                        "eventHandlers": [
                            {
                                "on": "range-select",
                                "type": "custom",
                                "parameters": {
                                    func: function (datum, b, c) {
                                        console.log(datum, b, c)
                                        comp.addFilter({
                                            key: 'ts',
                                            op: "inrange",
                                            val: [+datum.x_min.toFixed(0), +datum.x_max.toFixed(0) + 1],
                                            editing: false,
                                        });
                                        comp.newsearch();
                                    }
                                }
                            },
                            {
                                "on": "bar-click",
                                "type": "custom",
                                "parameters": {
                                    func: function (datum, b, c) {
                                        console.log(datum, b, c)
                                        comp.addFilter({
                                            key: 'ts',
                                            op: "inrange",
                                            val: [datum.name, datum.name + gap + 1],
                                            editing: false,
                                        });
                                        comp.newsearch();
                                    }
                                }
                            }
                        ],
                        "pwidth": '100%',
                        "pheight": '150px',
                        "xfield": 'name',
                        "yfields": ['count'],
                        "chartType": 'column'
                    }
                }
            ]
        }
    },
    init() {
        console.log('started kbplugin')
    },
})
