with open('src/components/Budgets.tsx', 'r') as f:
    content = f.read()

# Add import
if "import AlertThresholdsConfig" not in content:
    content = content.replace("import { Settings } from 'lucide-react';", "import { Settings } from 'lucide-react';\nimport AlertThresholdsConfig from './AlertThresholdsConfig';")

# Add state
if "const [emailAlerts, setEmailAlerts]" not in content:
    content = content.replace("const [thresholdsStr, setThresholdsStr] = useState('50, 80, 100');", "const [thresholdsStr, setThresholdsStr] = useState('50, 80, 100');\n  const [emailAlerts, setEmailAlerts] = useState(true);\n  const [dashboardAlerts, setDashboardAlerts] = useState(true);")

# Update POST request
if "email_alerts: emailAlerts, dashboard_alerts: dashboardAlerts" not in content:
    content = content.replace("body: JSON.stringify({ provider_id: providerId, limit: Number(limit), thresholds })", "body: JSON.stringify({ provider_id: providerId, limit: Number(limit), thresholds, email_alerts: emailAlerts, dashboard_alerts: dashboardAlerts })")

# Replace Thresholds UI with the component
old_thresholds = """            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-widest font-medium">Alert Thresholds (%)</label>
              <input 
                type="text" 
                value={thresholdsStr}
                onChange={(e) => setThresholdsStr(e.target.value)}
                placeholder="50, 80, 100"
                className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
              />
            </div>
          </div>"""

new_thresholds = """          </div>
          
          <AlertThresholdsConfig 
            thresholdsStr={thresholdsStr} 
            setThresholdsStr={setThresholdsStr}
            emailAlerts={emailAlerts}
            setEmailAlerts={setEmailAlerts}
            dashboardAlerts={dashboardAlerts}
            setDashboardAlerts={setDashboardAlerts}
          />"""
if "AlertThresholdsConfig" not in content:
    content = content.replace(old_thresholds, new_thresholds)

# Update table to show channels
old_th = """              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium">Alerts At</th>"""
new_th = """              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium">Alerts At</th>
              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium">Channels</th>"""
if "Channels</th>" not in content:
    content = content.replace(old_th, new_th)

old_td = """                  <td className="px-6 py-4 text-white/60 text-sm font-mono">
                    {budget.alert_thresholds ? budget.alert_thresholds.join('%, ') + '%' : '50%, 80%, 100%'}
                  </td>
                </tr>"""
new_td = """                  <td className="px-6 py-4 text-white/60 text-sm font-mono">
                    {budget.alert_thresholds ? budget.alert_thresholds.join('%, ') + '%' : '50%, 80%, 100%'}
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${budget.email_alerts_enabled ? 'bg-[#3DDC97]' : 'bg-white/20'}`} title="Email" />
                      <div className={`w-2 h-2 rounded-full ${budget.dashboard_alerts_enabled ? 'bg-[#3DDC97]' : 'bg-white/20'}`} title="Dashboard" />
                    </div>
                  </td>
                </tr>"""
if "budget.email_alerts_enabled" not in content:
    content = content.replace(old_td, new_td)

with open('src/components/Budgets.tsx', 'w') as f:
    f.write(content)
