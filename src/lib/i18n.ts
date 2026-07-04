// Photography Client Management — i18n translations
// Languages: English (en), Bahasa Indonesia (id)

export type Lang = 'en' | 'id';

export interface Dict {
  // ── App ──
  appName: string;
  appTagline: string;

  // ── Nav ──
  nav_dashboard: string;
  nav_jobs: string;
  nav_payments: string;
  nav_tasks: string;
  nav_wages: string;
  nav_settings: string;

  // ── Common ──
  common_new: string;
  common_edit: string;
  common_delete: string;
  common_cancel: string;
  common_save: string;
  common_close: string;
  common_add: string;
  common_search: string;
  common_select: string;
  common_loading: string;
  common_saving: string;
  common_none: string;
  common_all: string;
  common_notes: string;
  common_optional: string;
  common_required: string;
  common_standalone: string;

  // ── Dashboard ──
  dash_title: string;
  dash_activeJobs: string;
  dash_upcomingActive: string;
  dash_inEditing: string;
  dash_outstandingBal: string;
  dash_openTasks: string;
  dash_overdueTasks: string;
  dash_quickViews: string;
  dash_analytics: string;
  dash_revenueChart: string;
  dash_statusChart: string;
  dash_workflow: string;
  dash_recentJobs: string;
  dash_noJobs: string;
  dash_editingQueue: string;
  dash_openTasksCount: string;
  dash_distributions: string;

  // ── Jobs ──
  jobs_title: string;
  jobs_count: (n: number) => string;
  jobs_search: string;
  jobs_filterAll: string;
  jobs_filterActive: string;
  jobs_filterEditing: string;
  jobs_filterDone: string;
  jobs_empty: string;
  jobs_new: string;
  jobs_edit: string;
  jobs_newDesc: string;
  jobs_editDesc: string;
  jobs_client: string;
  jobs_phone: string;
  jobs_jobType: string;
  jobs_jobDate: string;
  jobs_location: string;
  jobs_status: string;
  jobs_totalFee: string;
  jobs_deposit: string;
  jobs_balance: string;
  jobs_paymentStatus: string;
  jobs_photographers: string;
  jobs_editors: string;
  jobs_clientSource: string;
  jobs_jobInfo: string;
  jobs_financial: string;
  jobs_team: string;
  jobs_payments: (n: number) => string;
  jobs_tasks: (n: number) => string;
  jobs_save: string;
  jobs_update: string;
  jobs_added: string;
  jobs_updated: string;
  jobs_deleted: string;
  jobs_deleteConfirm: string;
  jobs_deleteConfirmDesc: string;
  jobs_clientError: string;

  // ── Payments ──
  pay_title: string;
  pay_count: (n: number) => string;
  pay_new: string;
  pay_edit: string;
  pay_newDesc: string;
  pay_editDesc: string;
  pay_collected: string;
  pay_pending: string;
  pay_clients: string;
  pay_empty: string;
  pay_linkedJob: string;
  pay_client: string;
  pay_date: string;
  pay_amount: string;
  pay_method: string;
  pay_status: string;
  pay_job: string;
  pay_jobTotal: string;
  pay_jobBalance: string;
  pay_save: string;
  pay_update: string;
  pay_added: string;
  pay_updated: string;
  pay_deleted: string;
  pay_deleteConfirm: string;
  pay_deleteConfirmDesc: string;
  pay_clientError: string;
  pay_amountError: string;

  // ── Tasks ──
  task_title: string;
  task_count: (n: number) => string;
  task_new: string;
  task_edit: string;
  task_newDesc: string;
  task_editDesc: string;
  task_filterAll: string;
  task_filterOpen: string;
  task_filterDone: string;
  task_empty: string;
  task_linkedJob: string;
  task_client: string;
  task_task: string;
  task_dueDate: string;
  task_status: string;
  task_save: string;
  task_update: string;
  task_added: string;
  task_updated: string;
  task_deleted: string;
  task_statusCycled: (s: string) => string;
  task_deleteConfirm: string;
  task_deleteConfirmDesc: string;
  task_clientError: string;
  task_taskError: string;
  task_today: string;
  task_tomorrow: string;
  task_yesterday: string;

  // ── Wages ──
  wage_title: string;
  wage_count: (n: number) => string;
  wage_calculator: string;
  wage_selectJob: string;
  wage_chooseJob: string;
  wage_selectJobHint: string;
  wage_calculating: string;
  wage_grossAmount: string;
  wage_operationalExpenses: string;
  wage_totalExpenses: string;
  wage_distributableBase: string;
  wage_distributableBaseHint: string;
  wage_gross: string;
  wage_minusExpenses: string;
  wage_equalsDistributable: string;
  wage_save: string;
  wage_saveDistribution: string;
  wage_staff: string;
  wage_percent: string;
  wage_amount: string;
  wage_total: string;
  wage_verificationPassed: string;
  wage_verificationFailed: (a: string, b: string) => string;
  wage_noStaff: string;
  wage_expenseName: string;
  wage_expenseAmount: string;
  wage_addExpense: string;
  wage_totalCalculated: string;
  wage_savedRecords: string;
  wage_savedDistributions: string;
  wage_empty: string;
  wage_noSaved: string;
  wage_noSavedHint: string;
  wage_saved: string;
  wage_deleted: string;
  wage_deleteConfirm: string;
  wage_deleteConfirmDesc: string;
  wage_overview: string;
  wage_totalPaid: string;
  wage_date: string;
  wage_staffBreakdown: string;
  wage_standalone: string;
  wage_base: string;
  wage_staff_count: (n: number) => string;

  // ── Settings ──
  set_title: string;
  set_subtitle: string;
  set_saveAll: string;
  set_appearance: string;
  set_theme: string;
  set_themeDesc: string;
  set_themeToggle: string;
  set_language: string;
  set_languageDesc: string;
  set_dropdownLists: string;
  set_wageRules: string;
  set_totalPercent: string;
  set_shouldBe100: string;
  set_addRule: string;
  set_defaultExpenses: string;
  set_defaultExpensesHint: string;
  set_addExpenseTpl: string;
  set_fallbackRatio: string;
  set_fallbackRatioHint: (n: number) => string;
  set_staffRoles: string;
  set_name: string;
  set_primaryRole: string;
  set_phone: string;
  set_wageRoles: string;
  set_addStaff: string;
  set_backup: string;
  set_backupDesc: string;
  set_downloadBackup: string;
  set_importBackup: string;
  set_importConfirm: string;
  set_importConfirmDesc: string;
  set_import: string;
  set_importSuccess: string;
  set_importFailed: (e: string) => string;
  set_saved: string;
  set_add: string;
}

// ── English ────────────────────────────────────────────────────
export const en: Dict = {
  appName: 'Photography Client Management',
  appTagline: 'PHOTOGRAPHY TRACKER',

  nav_dashboard: 'Dashboard',
  nav_jobs: 'Jobs',
  nav_payments: 'Payments',
  nav_tasks: 'Tasks',
  nav_wages: 'Wages',
  nav_settings: 'Settings',

  common_new: 'New',
  common_edit: 'Edit',
  common_delete: 'Delete',
  common_cancel: 'Cancel',
  common_save: 'Save',
  common_close: 'Close',
  common_add: 'Add',
  common_search: 'Search',
  common_select: 'Select',
  common_loading: 'Loading...',
  common_saving: 'Saving...',
  common_none: 'None',
  common_all: 'All',
  common_notes: 'Notes',
  common_optional: 'optional',
  common_required: 'required',
  common_standalone: '— None (standalone) —',

  dash_title: 'Dashboard',
  dash_activeJobs: 'Active Jobs',
  dash_upcomingActive: 'Upcoming Active',
  dash_inEditing: 'In Editing',
  dash_outstandingBal: 'Outstanding Bal.',
  dash_openTasks: 'Open Tasks',
  dash_overdueTasks: 'Overdue Tasks',
  dash_quickViews: 'Quick Views',
  dash_analytics: 'Analytics',
  dash_revenueChart: 'Revenue (last 6 months)',
  dash_statusChart: 'Job Status Distribution',
  dash_workflow: 'Job Status Workflow',
  dash_recentJobs: 'Recent Jobs',
  dash_noJobs: 'No jobs yet',
  dash_editingQueue: 'Editing Queue',
  dash_openTasksCount: 'Open Tasks',
  dash_distributions: 'Distributions',

  jobs_title: 'Jobs',
  jobs_count: (n) => `${n} job${n !== 1 ? 's' : ''}`,
  jobs_search: 'Search by client, type, location, team, or ID...',
  jobs_filterAll: 'All',
  jobs_filterActive: 'Active',
  jobs_filterEditing: 'Editing',
  jobs_filterDone: 'Done / Cancelled',
  jobs_empty: 'No jobs in this filter',
  jobs_new: 'New Job',
  jobs_edit: 'Edit Job',
  jobs_newDesc: 'Add a new photography job',
  jobs_editDesc: (undefined as any), // set below
  jobs_client: 'Client',
  jobs_phone: 'Phone',
  jobs_jobType: 'Job Type',
  jobs_jobDate: 'Job Date',
  jobs_location: 'Location',
  jobs_status: 'Status',
  jobs_totalFee: 'Total Fee',
  jobs_deposit: 'Deposit',
  jobs_balance: 'Balance',
  jobs_paymentStatus: 'Payment Status',
  jobs_photographers: 'Photographer(s)',
  jobs_editors: 'Editor(s)',
  jobs_clientSource: 'Client Source',
  jobs_jobInfo: 'Job Info',
  jobs_financial: 'Financial',
  jobs_team: 'Team',
  jobs_payments: (n) => `Payments (${n})`,
  jobs_tasks: (n) => `Tasks (${n})`,
  jobs_save: 'Save Job',
  jobs_update: 'Update Job',
  jobs_added: 'Job added',
  jobs_updated: 'Job updated',
  jobs_deleted: 'Job deleted',
  jobs_deleteConfirm: 'Delete this job?',
  jobs_deleteConfirmDesc: 'This will permanently remove the job along with its related payments, tasks, and wage distributions. This action cannot be undone.',
  jobs_clientError: 'Client name is required',

  pay_title: 'Payments',
  pay_count: (n) => `${n} payment${n !== 1 ? 's' : ''}`,
  pay_new: 'New Payment',
  pay_edit: 'Edit Payment',
  pay_newDesc: 'Record a new payment',
  pay_editDesc: (undefined as any),
  pay_collected: 'Collected',
  pay_pending: 'Pending',
  pay_clients: 'Clients',
  pay_empty: 'No payment records yet',
  pay_linkedJob: 'Linked Job (optional)',
  pay_client: 'Client',
  pay_date: 'Date',
  pay_amount: 'Amount',
  pay_method: 'Method',
  pay_status: 'Status',
  pay_job: 'Job',
  pay_jobTotal: 'Job Total (snapshot)',
  pay_jobBalance: 'Job Balance (snapshot)',
  pay_save: 'Save Payment',
  pay_update: 'Update Payment',
  pay_added: 'Payment added',
  pay_updated: 'Payment updated',
  pay_deleted: 'Payment deleted',
  pay_deleteConfirm: 'Delete this payment?',
  pay_deleteConfirmDesc: 'This action cannot be undone. The job\'s balance will be restored if the payment was PAID.',
  pay_clientError: 'Client is required',
  pay_amountError: 'Amount must be greater than 0',

  task_title: 'Tasks',
  task_count: (n) => `${n} task${n !== 1 ? 's' : ''}`,
  task_new: 'New Task',
  task_edit: 'Edit Task',
  task_newDesc: 'Create a new task',
  task_editDesc: (undefined as any),
  task_filterAll: 'All',
  task_filterOpen: 'Open',
  task_filterDone: 'Done',
  task_empty: 'No tasks in this filter',
  task_linkedJob: 'Linked Job (optional)',
  task_client: 'Client',
  task_task: 'Task',
  task_dueDate: 'Due Date',
  task_status: 'Status',
  task_save: 'Save Task',
  task_update: 'Update Task',
  task_added: 'Task added',
  task_updated: 'Task updated',
  task_deleted: 'Task deleted',
  task_statusCycled: (s) => `Task status: ${s}`,
  task_deleteConfirm: 'Delete this task?',
  task_deleteConfirmDesc: 'This action cannot be undone.',
  task_clientError: 'Client is required',
  task_taskError: 'Task description is required',
  task_today: 'Today',
  task_tomorrow: 'Tomorrow',
  task_yesterday: 'Yesterday',

  wage_title: 'Wages',
  wage_count: (n) => `${n} distribution${n !== 1 ? 's' : ''}`,
  wage_calculator: 'Wage Calculator',
  wage_selectJob: 'Select Job',
  wage_chooseJob: '— Choose a job —',
  wage_selectJobHint: 'Select a job to calculate wages',
  wage_calculating: 'Calculating...',
  wage_grossAmount: 'Gross Amount (PAID payments)',
  wage_operationalExpenses: 'Operational Expenses',
  wage_totalExpenses: 'Total Expenses',
  wage_distributableBase: 'Distributable Base (editable)',
  wage_distributableBaseHint: 'Auto: Gross − Expenses. Override above if needed.',
  wage_gross: 'Gross',
  wage_minusExpenses: '− Expenses',
  wage_equalsDistributable: '= Distributable',
  wage_save: 'Save Distribution',
  wage_saveDistribution: 'Save Distribution',
  wage_staff: 'Staff',
  wage_percent: '%',
  wage_amount: 'Amount',
  wage_total: 'Total',
  wage_verificationPassed: 'Verification check passed — breakdown total equals distributable base.',
  wage_verificationFailed: (a, b) => `Verification mismatch: ${a} vs ${b}.`,
  wage_noStaff: 'No staff roles mapped for wage distribution. Add roles in Settings.',
  wage_expenseName: 'Expense name',
  wage_expenseAmount: 'Amount',
  wage_addExpense: 'Add',
  wage_totalCalculated: 'Total Calculated',
  wage_savedRecords: 'Saved Records',
  wage_savedDistributions: 'Saved Distributions',
  wage_empty: 'No wage distributions saved yet',
  wage_noSaved: 'No wage distributions saved yet',
  wage_noSavedHint: 'No wage distributions saved yet',
  wage_saved: 'Wage distribution saved',
  wage_deleted: 'Wage distribution deleted',
  wage_deleteConfirm: 'Delete this wage distribution?',
  wage_deleteConfirmDesc: 'This action cannot be undone.',
  wage_overview: 'Overview',
  wage_totalPaid: 'Total Paid',
  wage_date: 'Date',
  wage_staffBreakdown: 'Staff Breakdown',
  wage_standalone: 'Standalone',
  wage_base: 'Base',
  wage_staff_count: (n) => `${n} staff`,

  set_title: 'Settings',
  set_subtitle: 'Manage lists, wage rules, staff, and backups',
  set_saveAll: 'Save All',
  set_appearance: 'Appearance',
  set_theme: 'Theme',
  set_themeDesc: 'Toggle dark / light mode',
  set_themeToggle: 'Light',
  set_language: 'Language',
  set_languageDesc: 'Choose interface language',
  set_dropdownLists: 'Dropdown Lists',
  set_wageRules: 'Wage Rules (Role Percentages)',
  set_totalPercent: 'Total:',
  set_shouldBe100: 'should be 100%',
  set_addRule: 'Add Rule',
  set_defaultExpenses: 'Default Operational Expense Templates',
  set_defaultExpensesHint: 'Pre-populated when calculating wages for a new job.',
  set_addExpenseTpl: 'Add Expense Template',
  set_fallbackRatio: 'Fallback ratio:',
  set_fallbackRatioHint: (n) => `Used when no operational expenses are entered (${n}%)`,
  set_staffRoles: 'Staff & Roles',
  set_name: 'Name',
  set_primaryRole: 'Primary role',
  set_phone: 'Phone',
  set_wageRoles: 'Wage Roles (multi-select)',
  set_addStaff: 'Add Staff',
  set_backup: 'Data Backup & Restore',
  set_backupDesc: 'Export all jobs, payments, tasks, wage distributions, staff, and settings as a JSON file. Use Import to restore from a backup.',
  set_downloadBackup: 'Download Backup',
  set_importBackup: 'Import Backup',
  set_importConfirm: 'Import will REPLACE all data',
  set_importConfirmDesc: 'This will overwrite all current jobs, payments, tasks, wage distributions, and settings with the contents of the backup file. This cannot be undone. Continue?',
  set_import: 'Import',
  set_importSuccess: 'Data imported successfully',
  set_importFailed: (e) => `Import failed: ${e}`,
  set_saved: 'Settings saved',
  set_add: 'Add',
};

// Fill in the editDesc fields (they reference the same string as edit)
en.jobs_editDesc = 'Editing {id}';
en.pay_editDesc = 'Editing {id}';
en.task_editDesc = 'Editing {id}';

// ── Bahasa Indonesia ───────────────────────────────────────────
export const id: Dict = {
  appName: 'Manajemen Klien Fotografi',
  appTagline: 'PE LACAK FOTOGRAFI',

  nav_dashboard: 'Dasbor',
  nav_jobs: 'Pekerjaan',
  nav_payments: 'Pembayaran',
  nav_tasks: 'Tugas',
  nav_wages: 'Upah',
  nav_settings: 'Pengaturan',

  common_new: 'Baru',
  common_edit: 'Edit',
  common_delete: 'Hapus',
  common_cancel: 'Batal',
  common_save: 'Simpan',
  common_close: 'Tutup',
  common_add: 'Tambah',
  common_search: 'Cari',
  common_select: 'Pilih',
  common_loading: 'Memuat...',
  common_saving: 'Menyimpan...',
  common_none: 'Tidak ada',
  common_all: 'Semua',
  common_notes: 'Catatan',
  common_optional: 'opsional',
  common_required: 'wajib',
  common_standalone: '— Tidak ada (mandiri) —',

  dash_title: 'Dasbor',
  dash_activeJobs: 'Pekerjaan Aktif',
  dash_upcomingActive: 'Akan Datang',
  dash_inEditing: 'Sedang Edit',
  dash_outstandingBal: 'Saldo Tertunggak',
  dash_openTasks: 'Tugas Terbuka',
  dash_overdueTasks: 'Tugas Terlambat',
  dash_quickViews: 'Akses Cepat',
  dash_analytics: 'Analitik',
  dash_revenueChart: 'Pendapatan (6 bulan terakhir)',
  dash_statusChart: 'Distribusi Status Pekerjaan',
  dash_workflow: 'Alur Status Pekerjaan',
  dash_recentJobs: 'Pekerjaan Terbaru',
  dash_noJobs: 'Belum ada pekerjaan',
  dash_editingQueue: 'Antrian Edit',
  dash_openTasksCount: 'Tugas Terbuka',
  dash_distributions: 'Distribusi',

  jobs_title: 'Pekerjaan',
  jobs_count: (n) => `${n} pekerjaan`,
  jobs_search: 'Cari berdasarkan klien, jenis, lokasi, tim, atau ID...',
  jobs_filterAll: 'Semua',
  jobs_filterActive: 'Aktif',
  jobs_filterEditing: 'Sedang Edit',
  jobs_filterDone: 'Selesai / Dibatalkan',
  jobs_empty: 'Tidak ada pekerjaan di filter ini',
  jobs_new: 'Pekerjaan Baru',
  jobs_edit: 'Edit Pekerjaan',
  jobs_newDesc: 'Tambah pekerjaan fotografi baru',
  jobs_editDesc: 'Mengedit {id}',
  jobs_client: 'Klien',
  jobs_phone: 'Telepon',
  jobs_jobType: 'Jenis Pekerjaan',
  jobs_jobDate: 'Tanggal Pekerjaan',
  jobs_location: 'Lokasi',
  jobs_status: 'Status',
  jobs_totalFee: 'Total Biaya',
  jobs_deposit: 'Deposit',
  jobs_balance: 'Saldo',
  jobs_paymentStatus: 'Status Pembayaran',
  jobs_photographers: 'Fotografer',
  jobs_editors: 'Editor',
  jobs_clientSource: 'Sumber Klien',
  jobs_jobInfo: 'Info Pekerjaan',
  jobs_financial: 'Keuangan',
  jobs_team: 'Tim',
  jobs_payments: (n) => `Pembayaran (${n})`,
  jobs_tasks: (n) => `Tugas (${n})`,
  jobs_save: 'Simpan Pekerjaan',
  jobs_update: 'Perbarui Pekerjaan',
  jobs_added: 'Pekerjaan ditambahkan',
  jobs_updated: 'Pekerjaan diperbarui',
  jobs_deleted: 'Pekerjaan dihapus',
  jobs_deleteConfirm: 'Hapus pekerjaan ini?',
  jobs_deleteConfirmDesc: 'Ini akan menghapus pekerjaan secara permanen beserta pembayaran, tugas, dan distribusi upah terkait. Tindakan ini tidak dapat dibatalkan.',
  jobs_clientError: 'Nama klien wajib diisi',

  pay_title: 'Pembayaran',
  pay_count: (n) => `${n} pembayaran`,
  pay_new: 'Pembayaran Baru',
  pay_edit: 'Edit Pembayaran',
  pay_newDesc: 'Catat pembayaran baru',
  pay_editDesc: 'Mengedit {id}',
  pay_collected: 'Terkumpul',
  pay_pending: 'Tertunda',
  pay_clients: 'Klien',
  pay_empty: 'Belum ada catatan pembayaran',
  pay_linkedJob: 'Pekerjaan Terkait (opsional)',
  pay_client: 'Klien',
  pay_date: 'Tanggal',
  pay_amount: 'Jumlah',
  pay_method: 'Metode',
  pay_status: 'Status',
  pay_job: 'Pekerjaan',
  pay_jobTotal: 'Total Pekerjaan (snapshot)',
  pay_jobBalance: 'Saldo Pekerjaan (snapshot)',
  pay_save: 'Simpan Pembayaran',
  pay_update: 'Perbarui Pembayaran',
  pay_added: 'Pembayaran ditambahkan',
  pay_updated: 'Pembayaran diperbarui',
  pay_deleted: 'Pembayaran dihapus',
  pay_deleteConfirm: 'Hapus pembayaran ini?',
  pay_deleteConfirmDesc: 'Tindakan ini tidak dapat dibatalkan. Saldo pekerjaan akan dipulihkan jika pembayaran berstatus PAID.',
  pay_clientError: 'Klien wajib diisi',
  pay_amountError: 'Jumlah harus lebih besar dari 0',

  task_title: 'Tugas',
  task_count: (n) => `${n} tugas`,
  task_new: 'Tugas Baru',
  task_edit: 'Edit Tugas',
  task_newDesc: 'Buat tugas baru',
  task_editDesc: 'Mengedit {id}',
  task_filterAll: 'Semua',
  task_filterOpen: 'Terbuka',
  task_filterDone: 'Selesai',
  task_empty: 'Tidak ada tugas di filter ini',
  task_linkedJob: 'Pekerjaan Terkait (opsional)',
  task_client: 'Klien',
  task_task: 'Tugas',
  task_dueDate: 'Tanggal Jatuh Tempo',
  task_status: 'Status',
  task_save: 'Simpan Tugas',
  task_update: 'Perbarui Tugas',
  task_added: 'Tugas ditambahkan',
  task_updated: 'Tugas diperbarui',
  task_deleted: 'Tugas dihapus',
  task_statusCycled: (s) => `Status tugas: ${s}`,
  task_deleteConfirm: 'Hapus tugas ini?',
  task_deleteConfirmDesc: 'Tindakan ini tidak dapat dibatalkan.',
  task_clientError: 'Klien wajib diisi',
  task_taskError: 'Deskripsi tugas wajib diisi',
  task_today: 'Hari ini',
  task_tomorrow: 'Besok',
  task_yesterday: 'Kemarin',

  wage_title: 'Upah',
  wage_count: (n) => `${n} distribusi`,
  wage_calculator: 'Kalkulator Upah',
  wage_selectJob: 'Pilih Pekerjaan',
  wage_chooseJob: '— Pilih pekerjaan —',
  wage_selectJobHint: 'Pilih pekerjaan untuk menghitung upah',
  wage_calculating: 'Menghitung...',
  wage_grossAmount: 'Jumlah Kotor (pembayaran PAID)',
  wage_operationalExpenses: 'Pengeluaran Operasional',
  wage_totalExpenses: 'Total Pengeluaran',
  wage_distributableBase: 'Dasar Distribusi (dapat diubah)',
  wage_distributableBaseHint: 'Otomatis: Kotor − Pengeluaran. Ubah di atas jika perlu.',
  wage_gross: 'Kotor',
  wage_minusExpenses: '− Pengeluaran',
  wage_equalsDistributable: '= Distribusi',
  wage_save: 'Simpan Distribusi',
  wage_saveDistribution: 'Simpan Distribusi',
  wage_staff: 'Staf',
  wage_percent: '%',
  wage_amount: 'Jumlah',
  wage_total: 'Total',
  wage_verificationPassed: 'Verifikasi berhasil — total rincian sama dengan dasar distribusi.',
  wage_verificationFailed: (a, b) => `Verifikasi tidak cocok: ${a} vs ${b}.`,
  wage_noStaff: 'Tidak ada peran staf yang dipetakan untuk distribusi upah. Tambahkan peran di Pengaturan.',
  wage_expenseName: 'Nama pengeluaran',
  wage_expenseAmount: 'Jumlah',
  wage_addExpense: 'Tambah',
  wage_totalCalculated: 'Total Dihitung',
  wage_savedRecords: 'Catatan Tersimpan',
  wage_savedDistributions: 'Distribusi Tersimpan',
  wage_empty: 'Belum ada distribusi upah tersimpan',
  wage_noSaved: 'Belum ada distribusi upah tersimpan',
  wage_noSavedHint: 'Belum ada distribusi upah tersimpan',
  wage_saved: 'Distribusi upah disimpan',
  wage_deleted: 'Distribusi upah dihapus',
  wage_deleteConfirm: 'Hapus distribusi upah ini?',
  wage_deleteConfirmDesc: 'Tindakan ini tidak dapat dibatalkan.',
  wage_overview: 'Ikhtisar',
  wage_totalPaid: 'Total Dibayar',
  wage_date: 'Tanggal',
  wage_staffBreakdown: 'Rincian Staf',
  wage_standalone: 'Mandiri',
  wage_base: 'Dasar',
  wage_staff_count: (n) => `${n} staf`,

  set_title: 'Pengaturan',
  set_subtitle: 'Kelola daftar, aturan upah, staf, dan cadangan',
  set_saveAll: 'Simpan Semua',
  set_appearance: 'Tampilan',
  set_theme: 'Tema',
  set_themeDesc: 'Beralih mode gelap / terang',
  set_themeToggle: 'Terang',
  set_language: 'Bahasa',
  set_languageDesc: 'Pilih bahasa antarmuka',
  set_dropdownLists: 'Daftar Dropdown',
  set_wageRules: 'Aturan Upah (Persentase Peran)',
  set_totalPercent: 'Total:',
  set_shouldBe100: 'harus 100%',
  set_addRule: 'Tambah Aturan',
  set_defaultExpenses: 'Templat Pengeluaran Operasional Default',
  set_defaultExpensesHint: 'Diisi otomatis saat menghitung upah untuk pekerjaan baru.',
  set_addExpenseTpl: 'Tambah Templat Pengeluaran',
  set_fallbackRatio: 'Rasio fallback:',
  set_fallbackRatioHint: (n) => `Digunakan saat tidak ada pengeluaran operasional (${n}%)`,
  set_staffRoles: 'Staf & Peran',
  set_name: 'Nama',
  set_primaryRole: 'Peran utama',
  set_phone: 'Telepon',
  set_wageRoles: 'Peran Upah (pilih banyak)',
  set_addStaff: 'Tambah Staf',
  set_backup: 'Cadangkan & Pulihkan Data',
  set_backupDesc: 'Ekspor semua pekerjaan, pembayaran, tugas, distribusi upah, staf, dan pengaturan sebagai file JSON. Gunakan Impor untuk memulihkan dari cadangan.',
  set_downloadBackup: 'Unduh Cadangan',
  set_importBackup: 'Impor Cadangan',
  set_importConfirm: 'Impor akan MENGGANTI semua data',
  set_importConfirmDesc: 'Ini akan menimpa semua pekerjaan, pembayaran, tugas, distribusi upah, dan pengaturan saat ini dengan isi file cadangan. Tindakan ini tidak dapat dibatalkan. Lanjutkan?',
  set_import: 'Impor',
  set_importSuccess: 'Data berhasil diimpor',
  set_importFailed: (e) => `Impor gagal: ${e}`,
  set_saved: 'Pengaturan disimpan',
  set_add: 'Tambah',
};

export const dictionaries: Record<Lang, Dict> = { en, id };
