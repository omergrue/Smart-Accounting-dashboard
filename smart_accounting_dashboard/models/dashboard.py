from odoo import models, fields, api
from datetime import date, timedelta

class SmartAccountingDashboard(models.AbstractModel):
    _name = 'smart.accounting.dashboard'
    _description = 'Smart Accounting Dashboard'

    @api.model
    def get_dashboard_stats(self):
        income_types = ['income', 'income_other']
        expense_types = ['expense', 'expense_direct_cost', 'expense_depreciation']
        cash_types = ['asset_cash']
        
        def get_balance(account_types):
            self.env.cr.execute("""
                SELECT SUM(balance)
                FROM account_move_line aml
                JOIN account_account aa ON aa.id = aml.account_id
                JOIN account_move am ON am.id = aml.move_id
                WHERE aa.account_type IN %s AND am.state = 'posted'
            """, (tuple(account_types),))
            res = self.env.cr.fetchone()
            return res[0] or 0.0

        total_income = -get_balance(income_types) # Income balances are usually credit (negative)
        total_costs = get_balance(expense_types)  # Expense balances are usually debit (positive)
        net_profit = total_income - total_costs
        liquidity = get_balance(cash_types)

        today = date.today()
        
        def get_aging(account_types):
            res = {'0-30': 0, '31-60': 0, '61+': 0}
            self.env.cr.execute("""
                SELECT sum(amount_residual), aml.date_maturity
                FROM account_move_line aml
                JOIN account_account aa ON aa.id = aml.account_id
                JOIN account_move am ON am.id = aml.move_id
                WHERE aa.account_type IN %s 
                  AND am.state = 'posted' 
                  AND aml.reconciled = False
                GROUP BY aml.date_maturity
            """, (tuple(account_types),))
            
            for amount, maturity in self.env.cr.fetchall():
                if not amount or not maturity:
                    continue
                days = (today - maturity).days
                if days <= 30:
                    res['0-30'] += amount
                elif days <= 60:
                    res['31-60'] += amount
                else:
                    res['61+'] += amount
            return res
            
        ar_aging = get_aging(['asset_receivable'])
        ap_aging = get_aging(['liability_payable'])
        
        ap_aging = {k: abs(v) for k, v in ap_aging.items()}

        return {
            'total_income': total_income,
            'total_costs': total_costs,
            'net_profit': net_profit,
            'liquidity': liquidity,
            'ar_aging': ar_aging,
            'ap_aging': ap_aging,
        }
