/** @odoo-module **/

import { Component, onWillStart, onMounted, useState, useRef } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { loadJS } from "@web/core/network/download";

export class SmartAccountingDashboard extends Component {
    setup() {
        this.orm = useService("orm");
        
        this.state = useState({
            data: {
                total_income: 0,
                total_costs: 0,
                net_profit: 0,
                liquidity: 0,
                ar_aging: {'0-30': 0, '31-60': 0, '61+': 0},
                ap_aging: {'0-30': 0, '31-60': 0, '61+': 0},
            }
        });

        this.barChartCanvas = useRef("barChartCanvas");
        this.pieChartCanvas = useRef("pieChartCanvas");
        this.charts = {};

        onWillStart(async () => {
            await Promise.all([
                loadJS("https://cdn.jsdelivr.net/npm/chart.js"),
                this.fetchData()
            ]);
        });

        onMounted(() => {
            this.renderCharts();
        });
    }

    async fetchData() {
        const result = await this.orm.call("smart.accounting.dashboard", "get_dashboard_stats", []);
        if (result) {
            Object.assign(this.state.data, result);
        }
    }

    async onRefresh() {
        await this.fetchData();
        this.updateCharts();
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
    }

    renderCharts() {
        if (!window.Chart) return;

        // Bar Chart
        if (this.barChartCanvas.el) {
            const ctxBar = this.barChartCanvas.el.getContext('2d');
            this.charts.bar = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['Revenue', 'Expenses', 'Net Profit'],
                    datasets: [{
                        label: 'Amount',
                        data: [
                            this.state.data.total_income,
                            this.state.data.total_costs,
                            this.state.data.net_profit
                        ],
                        backgroundColor: [
                            'rgba(57, 106, 255, 0.8)', // blue.500
                            'rgba(255, 75, 74, 0.8)',  // danger
                            'rgba(74, 222, 128, 0.8)'  // success
                        ],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Pie Chart
        if (this.pieChartCanvas.el) {
            const ctxPie = this.pieChartCanvas.el.getContext('2d');
            this.charts.pie = new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: ['0-30 Days', '31-60 Days', '61+ Days'],
                    datasets: [{
                        data: [
                            this.state.data.ar_aging['0-30'],
                            this.state.data.ar_aging['31-60'],
                            this.state.data.ar_aging['61+']
                        ],
                        backgroundColor: [
                            '#396AFF', // blue.500
                            '#FEAA09', // warning
                            '#FF4B4A'  // danger
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    updateCharts() {
        if (this.charts.bar) {
            this.charts.bar.data.datasets[0].data = [
                this.state.data.total_income,
                this.state.data.total_costs,
                this.state.data.net_profit
            ];
            this.charts.bar.update();
        }
        
        if (this.charts.pie) {
            this.charts.pie.data.datasets[0].data = [
                this.state.data.ar_aging['0-30'],
                this.state.data.ar_aging['31-60'],
                this.state.data.ar_aging['61+']
            ];
            this.charts.pie.update();
        }
    }
}

SmartAccountingDashboard.template = "smart_accounting_dashboard.dashboard";
registry.category("actions").add("smart_accounting_dashboard.dashboard", SmartAccountingDashboard);
