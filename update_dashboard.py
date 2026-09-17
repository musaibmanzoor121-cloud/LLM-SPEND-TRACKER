with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

if "import { Download" not in content:
    content = content.replace("import { RefreshCw } from 'lucide-react';", "import { RefreshCw, Download } from 'lucide-react';")

# Add handleDownloadCSV function
download_func = """
  const handleDownloadCSV = async () => {
    try {
      const res = await fetch('/api/reports/csv', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `watchdog-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
    }
  };
"""

if "const handleDownloadCSV" not in content:
    content = content.replace("const triggerSync = async () => {", download_func + "\n  const triggerSync = async () => {")

# Add button
old_button_group = """        <div className="flex items-center gap-3">
          <select"""
new_button_group = """        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 bg-[#0A0F1C] hover:bg-[#111827] border border-white/10 text-white/80 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
            title="Download CSV Report"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <select"""

if "Export CSV" not in content:
    content = content.replace(old_button_group, new_button_group)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
