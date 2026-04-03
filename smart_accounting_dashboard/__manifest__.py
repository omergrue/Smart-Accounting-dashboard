{
    "name": "Smart odoo module accounting dashboard",
    "version": "1.0.0",
    "author": "DevLands",
    "price": "100.00",
    "currency": "USD",
    "depends": ["account", "web"],
    "data": [
        "views/dashboard_action.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "smart_accounting_dashboard/static/src/components/dashboard.scss",
            "smart_accounting_dashboard/static/src/components/dashboard.xml",
            "smart_accounting_dashboard/static/src/components/dashboard.js",
        ],
    },
    "images": ["static/description/screenshot.png"],
    "installable": True,
    "application": True,
    "license": "LGPL-3",
}
