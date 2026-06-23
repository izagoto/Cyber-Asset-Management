import sys

with open('src/pages/Loans.tsx', 'r') as f:
    content = f.read()

# 1. Replace state
content = content.replace('const [view, setView] = useState<"admin" | "request">(isAdmin ? "admin" : "request");', 'const [showAddModal, setShowAddModal] = useState(false);')

# 2. Update handleSubmit
content = content.replace('setQuantity(1);', 'setQuantity(1);\n      setShowAddModal(false);')

# 3. Replace the header buttons
old_header = """          {isAdmin && (
            <div className="flex items-center gap-3 shrink-0">
              {view === "request" ? (
                <button
                  onClick={() => setView("admin")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  <ChevronLeft size={13} /> Back to Dashboard
                </button>
              ) : (
                <button
                  onClick={() => setView("request")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-white/95 text-[#DC2626] border border-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={13} /> Add Loan
                </button>
              )}
            </div>
          )}"""

new_header = """          {isAdmin && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setStep(1);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-white/95 text-[#DC2626] border border-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <Plus size={13} /> Add Loan
              </button>
            </div>
          )}"""
content = content.replace(old_header, new_header)

# 4. Extract wizard and admin view
# The structure is:
#         {/* View Rendering */}
#         {view === "request" ? (
# WIZARD
#         ) : (
# ADMIN
#         )}
#       </div>

start_tag = '        {/* View Rendering */}\n        {view === "request" ? (\n'
if start_tag in content:
    idx_start = content.find(start_tag)
    idx_mid = content.find('        ) : (\n', idx_start)
    idx_end = content.find('        )}\n      </div>\n', idx_mid)
    
    wizard_code = content[idx_start + len(start_tag) : idx_mid]
    admin_code = content[idx_mid + len('        ) : (\n') : idx_end]
    
    # Replace the whole block with just admin_code
    new_block = '        {/* Admin Dashboard */}\n' + admin_code + '      </div>\n'
    
    # Construct the modal from wizard_code
    modal_code = """
      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:pl-[256px] bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-linear-to-r from-[#DC2626] to-[#B91C1C] px-6 py-4 flex items-center justify-between text-white rounded-t-2xl shrink-0">
              <div>
                <h3 className="text-sm font-bold font-mono">Add Loan Record</h3>
                <p className="text-[10px] opacity-85 font-mono mt-0.5">Fill in the details to check out an asset.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-white/10 rounded transition-all cursor-pointer text-white/80 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto p-2">
""" + wizard_code + """            </div>
          </div>
        </div>
      )}
"""
    content = content[:idx_start] + new_block + content[idx_end + len('        )}\n      </div>\n'):]
    
    # Append the modal just before the end
    end_tag = '      {/* Detail Loan Modal */}'
    content = content.replace(end_tag, modal_code + '\n' + end_tag)

with open('src/pages/Loans.tsx', 'w') as f:
    f.write(content)

