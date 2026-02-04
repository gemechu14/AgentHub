"use client";

export function MembersTab() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 w-[65%]">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">
        Team Members
      </h2>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {/* Empty state */}
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                No team members found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

