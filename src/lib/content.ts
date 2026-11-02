/**
 * Sumber kebenaran konten: presentasi "Metaheuristik — Algoritma JAYA dan
 * Simulated Annealing (SA)", Kelompok 4 Kelas C, ITS.
 * Jangan mengubah rumus/angka di sini tanpa memperbarui unit test.
 */

export interface Member {
  name: string
  nrp: string
}

export interface TraitCard {
  title: string
  description: string
  icon: 'compass' | 'crowd' | 'bolt' | 'scroll' | 'point' | 'scales' | 'snow' | 'feather'
}

export interface ProConItem {
  title: string
  detail: string
}

export type PlateKind =
  | 'jaya-init'
  | 'jaya-fitness'
  | 'jaya-update'
  | 'jaya-select'
  | 'jaya-loop'
  | 'sa-etc'
  | 'sa-solution'
  | 'sa-loads'
  | 'sa-cost'
  | 'sa-temp0'
  | 'sa-neighbor'
  | 'sa-delta'
  | 'sa-metropolis'
  | 'sa-best'
  | 'sa-cool'

export interface WorkStep {
  numeral: string
  title: string
  kicker: string
  latex?: string
  paragraphs: string[]
  bullets?: { term: string; text: string }[]
  example?: {
    label: string
    latex: string
    note?: string
  }
  note?: string
  plate: PlateKind
  caption: string
}

export const identity = {
  title: 'METAHEURISTIK',
  subtitle: 'Algoritma JAYA & Simulated Annealing',
  group: 'Kelompok 4 Kelas C',
  institution: 'Institut Teknologi Sepuluh Nopember',
  members: [
    { name: 'I Dewa Made Satya Raditya', nrp: '5027231051' },
    { name: 'Ahmad Wildan Fawwaz', nrp: '5027241001' },
    { name: 'Muhammad Rakha Hananditya Rauf', nrp: '5027241015' },
    { name: 'Theodorus Aaron Ugraha', nrp: '5027241056' },
    { name: 'M. Hikari Reiziq Rakhmadinta', nrp: '5027241079' },
  ] as Member[],
} as const

export const intro = {
  title: 'Pengantar',
  lead: 'Metaheuristik adalah keluarga algoritma pencarian yang tidak menjamin solusi paling optimum, tetapi berupaya menemukan solusi yang cukup baik dalam waktu yang wajar — terutama ketika ruang solusi terlalu luas untuk diperiksa satu per satu.',
  body: 'Presentasi ini membahas dua algoritma metaheuristik. JAYA mengelola sekumpulan kandidat solusi sekaligus: setiap kandidat bergerak menuju solusi terbaik dan menjauhi solusi terburuk. Simulated Annealing hanya membawa satu solusi, tetapi dapat menerima solusi yang lebih buruk pada awal proses, meniru proses pendinginan logam.',
  contrast: [
    {
      key: 'jaya',
      title: 'Berbasis Populasi',
      text: 'Banyak kandidat solusi dikelola bersamaan. Memori lebih besar, tetapi eksplorasi lebih luas.',
    },
    {
      key: 'sa',
      title: 'Solusi Tunggal',
      text: 'Satu solusi berjalan dalam satu waktu. Hemat memori, dan dapat menerima solusi yang lebih buruk untuk sementara.',
    },
  ],
}

export const jaya = {
  id: 'jaya',
  label: 'JAYA',
  realTitle: 'Algoritma JAYA',
  tagline: 'Algoritma JAYA',
  motto: 'Menuju solusi terbaik, menjauhi solusi terburuk.',
  definisi:
    'JAYA adalah algoritma metaheuristika berbasis populasi yang diperkenalkan oleh R.V. Rao pada tahun 2016. Nama JAYA berasal dari bahasa Sansekerta yang berarti Kemenangan atau Keberhasilan untuk mencapai solusi terbaik.',
  definisiHighlights: ['berbasis populasi', 'R.V. Rao pada tahun 2016', 'Sansekerta', 'Kemenangan'],
  philosophy: [
    {
      title: 'Mendekati Solusi Terbaik',
      text: 'Setiap kandidat bergerak menuju kandidat terbaik (P_best) yang ditemukan populasi.',
      icon: 'approach' as const,
    },
    {
      title: 'Menjauhi Solusi Terburuk',
      text: 'Pada saat yang sama, kandidat menghindari lokasi kandidat terburuk (P_worst).',
      icon: 'avoid' as const,
    },
  ],
  context:
    'Dalam slide, JAYA diterapkan pada penjadwalan task ke VM di cloud IaaS: user mengirim request → scheduler dengan algoritma JAYA dan QoS metrics → task buffer → resource monitor/load balancer → datacenter/cluster/host → alokasi task ke VM.',
  characteristics: [
    {
      title: 'Bebas Parameter Spesifik',
      description: 'Tanpa tuning parameter spesifik algoritma.',
      icon: 'compass',
    },
    {
      title: 'Berbasis Populasi',
      description: 'Mengelola banyak kandidat solusi bersamaan.',
      icon: 'crowd',
    },
    {
      title: 'Konvergensi Cepat',
      description: 'Efisiensi komputasi tinggi untuk fungsi kompleks.',
      icon: 'bolt',
    },
    {
      title: 'Mudah Diimplementasi',
      description: 'Logika pembaruan sederhana dan efisien.',
      icon: 'scroll',
    },
  ] as TraitCard[],
  pros: [
    {
      title: 'Unggul di Makespan dan Resource Utilization',
      detail:
        'Task selesai lebih cepat dan VM terpakai lebih merata dibanding GA dan BPSO.',
    },
    {
      title: 'Bebas Parameter Spesifik',
      detail:
        'Tidak perlu tuning khusus seperti SA — cukup ukuran populasi dan jumlah iterasi.',
    },
    {
      title: 'Simpel',
      detail: 'Satu rumus pembaruan, tanpa crossover atau mutasi.',
    },
    {
      title: 'Eksplorasi dan Eksploitasi Seimbang',
      detail:
        'Mendekati solusi terbaik sambil menjauhi solusi terburuk dalam satu langkah yang sama.',
    },
    {
      title: 'Fleksibel',
      detail:
        'Fitness dapat memuat makespan, utilisasi, dan energi, serta mudah digabung dengan load balancing.',
    },
  ] as ProConItem[],
  cons: [
    {
      title: 'Mudah Terjebak Optimum Lokal',
      detail:
        'Semua kandidat mengejar solusi terbaik yang sama, sehingga variasi cepat habis.',
    },
    {
      title: 'Perlu Konversi Kontinu ke Diskret',
      detail:
        'Hasil JAYA berupa desimal, padahal nomor VM harus bilangan bulat.',
    },
    {
      title: 'Tanpa Load Balancing Bawaan',
      detail: 'Hanya mengejar fitness, sehingga beban antar-VM bisa timpang.',
    },
    {
      title: 'Komputasi Berat',
      detail:
        'Semua kandidat dihitung ulang tiap iterasi; hasil bergantung pada ukuran populasi dan jumlah iterasi.',
    },
    {
      title: 'Pengujian Terbatas',
      detail:
        'Paper hanya menguji lewat simulasi dengan task independen dan non-preemptive.',
    },
  ] as ProConItem[],
  steps: [
    {
      numeral: 'I',
      title: 'Inisiasi Populasi',
      kicker: 'Membangkitkan populasi awal',
      latex: 'X_{0}^{k} = X_{\\min} + (X_{\\max} - X_{\\min}) \\times r',
      paragraphs: [
        'JAYA memulai proses dengan membuat beberapa kandidat solusi — beberapa kemungkinan pemetaan task ke VM yang nantinya dibandingkan untuk memperoleh pemetaan terbaik. Nilai awal setiap kandidat dibangkitkan secara acak.',
        'X_min dan X_max ditentukan dari ruang solusi yang diperbolehkan, yakni batas penempatan task sesuai jumlah VM yang tersedia, sehingga tidak ada kandidat yang merepresentasikan penempatan pada VM yang tidak ada.',
      ],
      bullets: [
        { term: 'X_0^k', text: 'nilai awal kandidat solusi' },
        { term: 'X_min', text: 'batas minimum nilai yang diperbolehkan' },
        { term: 'X_max', text: 'batas maksimum nilai yang diperbolehkan' },
        { term: 'r', text: 'bilangan acak dengan rentang 0–1' },
      ],
      plate: 'jaya-init',
      caption: 'Kandidat awal disebar merata di dalam batas ruang solusi.',
    },
    {
      numeral: 'II',
      title: 'Evaluasi Fitness',
      kicker: 'Menghitung nilai fitness',
      latex: 'F = (F_1 \\times \\omega_1) + (F_2 \\times \\omega_2)',
      paragraphs: [
        'Setiap kandidat diberi nilai fitness: seberapa baik pemetaan task–VM memenuhi tujuan optimasi. Fitness function tidak punya satu rumus tetap dalam JAYA karena disesuaikan dengan masalah.',
        'Empat metrik yang dipakai: Makespan (MS), Average Resource Utilization (ARU), Average Throughput (AT), dan Energy Consumption (EC). F1 menilai performa waktu dan pemanfaatan resource, sedangkan F2 menghitung total konsumsi energi kandidat.',
      ],
      bullets: [
        {
          term: 'Completion Time',
          text: 'CT_ij = Len_i / PT_j — waktu penyelesaian task ke-i pada VM ke-j.',
        },
        {
          term: 'Execution Time',
          text: 'ET_j = Σ X_ij × CT_ij — total waktu eksekusi VM ke-j.',
        },
        {
          term: 'Makespan & komponen',
          text: 'MS = max(ET_j), F1 = (1/MS) × ARU × AT, F2 = Σ EC_j.',
        },
        {
          term: 'P_best & P_worst',
          text: 'P_best = kandidat dengan F minimum; P_worst = kandidat dengan F maksimum.',
        },
      ],
      example: {
        label: 'Arah optimasi',
        latex: 'P_{best} = \\arg\\min_k F_k \\qquad P_{worst} = \\arg\\max_k F_k',
        note: 'Semakin kecil F, semakin baik kualitas pemetaan.',
      },
      note: 'Pada simulator, fitness didefinisikan sebagai nilai yang diminimalkan — lihat Catatan Akurasi di bagian bawah.',
      plate: 'jaya-fitness',
      caption: 'Setiap kandidat dihitung nilai fitness-nya; nilai terkecil menjadi P_best, terbesar menjadi P_worst.',
    },
    {
      numeral: 'III',
      title: 'Pembaruan Kandidat Solusi',
      kicker: 'Mendekati P_best dan menjauhi P_worst',
      latex:
        'X_i^{k+1} = X_i^{k} + r_1\\left(P_{best_i} - \\left|X_i^{k}\\right|\\right) - r_2\\left(P_{worst_i} - \\left|X_i^{k}\\right|\\right)',
      paragraphs: [
        'Setelah P_best dan P_worst diperoleh, setiap kandidat diperbarui agar bergerak mendekati solusi terbaik dan menjauhi solusi terburuk. r1 dan r2 adalah bilangan acak 0–1 yang mengatur besar pengaruh masing-masing arah.',
      ],
      bullets: [
        { term: 'X_i^k', text: 'nilai penempatan task ke-i pada iterasi ke-k' },
        { term: 'X_i^{k+1}', text: 'nilai baru setelah diarahkan mendekati P_best dan menjauhi P_worst' },
        { term: 'P_best_i', text: 'nilai penempatan task ke-i pada kandidat terbaik' },
        { term: 'P_worst_i', text: 'nilai penempatan task ke-i pada kandidat terburuk' },
        { term: 'r1, r2', text: 'bilangan acak 0–1, besar pengaruh P_best dan P_worst' },
      ],
      example: {
        label: 'Contoh slide — Task 2',
        latex:
          'X_2^{k+1} = 2 + 0{,}5\\,(3 - |2|) - 0{,}5\\,(1 - |2|) = 2 + 0{,}5(1) - 0{,}5(-1) = 3',
        note: 'Task 2 berpindah dari VM ke-2 ke VM ke-3: bergerak menuju P_best dan menjauhi P_worst.',
      },
      plate: 'jaya-update',
      caption: 'Panah hijau menunjukkan arah menuju P_best, panah merah putus-putus menunjukkan arah menjauhi P_worst; hasilnya X′.',
    },
    {
      numeral: 'IV',
      title: 'Seleksi Solusi',
      kicker: 'Mempertahankan solusi yang lebih baik',
      latex: 'F\\left(X^{k+1}\\right) < F\\left(X^{k}\\right)',
      paragraphs: [
        'Setelah kandidat baru X^{k+1} diperoleh, fitness-nya dibandingkan dengan kandidat sebelumnya X^k. Jika fitness kandidat baru lebih kecil (lebih baik), X^{k+1} diterima dan menggantikan kandidat sebelumnya. Jika tidak, X^k dipertahankan.',
        'Tujuannya: pembaruan hanya dipertahankan jika menghasilkan solusi yang lebih baik, sehingga kualitas populasi tidak menurun pada iterasi berikutnya.',
      ],
      plate: 'jaya-select',
      caption: 'Kandidat dengan fitness lebih baik diterima; kandidat yang kalah kembali ke posisi semula.',
    },
    {
      numeral: 'V',
      title: 'Iterasi',
      kicker: 'Mengulang proses evaluasi dan pembaruan',
      paragraphs: [
        'Kandidat yang dipertahankan menjadi populasi iterasi berikutnya, lalu seluruh kandidat dievaluasi kembali untuk menentukan P_best dan P_worst yang baru. Nilai keduanya dapat berubah tiap iterasi karena kualitas kandidat berubah.',
        'Menurut slide, proses dihentikan jika posisi P_best dan P_worst sudah tidak berubah lagi. Setelah kondisi berhenti tercapai, P_best menjadi solusi akhir: pemetaan task–VM terbaik yang diperoleh selama proses optimasi.',
      ],
      bullets: [
        { term: 'Siklus', text: 'Evaluasi Fitness → P_best/P_worst → Pembaruan → Seleksi → ulangi.' },
        { term: 'Berhenti', text: 'P_best dan P_worst tidak lagi berubah.' },
        { term: 'Keluaran', text: 'P_best — pemetaan task–VM terbaik.' },
        { term: 'Di simulator', text: 'Ditambah batas iterasi maksimum sebagai praktik standar; keduanya ditampilkan.' },
      ],
      note: 'Simulator juga berhenti saat batas iterasi maksimum tercapai, walaupun posisi P_best/P_worst belum stabil.',
      plate: 'jaya-loop',
      caption: 'Empat tahap yang berulang: evaluasi fitness, penentuan P_best/P_worst, pembaruan kandidat, dan seleksi.',
    },
  ] as WorkStep[],
} as const

export const sa = {
  id: 'sa',
  label: 'SA',
  realTitle: 'Simulated Annealing',
  tagline: 'Simulated Annealing',
  motto: 'Menerima solusi lebih buruk pada awal, lalu menurunkan peluangnya seiring penurunan temperatur.',
  definisi:
    'Simulated Annealing (SA) adalah algoritma metaheuristika berbasis solusi tunggal yang disimulasikan dari proses fisik pendinginan logam. Algoritma ini terinspirasi dari teori fisika (Metalurgi): memanaskan logam hingga suhu tinggi lalu mendinginkannya perlahan untuk mencapai struktur kristal berenergi minimum.',
  definisiHighlights: ['berbasis solusi tunggal', 'pendinginan logam', 'Metalurgi', 'kristal berenergi minimum'],
  characteristics: [
    {
      title: 'Single-Solution',
      description: 'Memproses satu titik solusi dalam satu waktu.',
      icon: 'point',
    },
    {
      title: 'Kriteria Metropolis',
      description: 'Menerima solusi buruk berdasarkan probabilitas P = e^(−ΔE/T).',
      icon: 'scales',
    },
    {
      title: 'Jadwal Pendinginan',
      description: 'Suhu diturunkan bertahap, misalnya T = α × T.',
      icon: 'snow',
    },
    {
      title: 'Penggunaan Memori Rendah',
      description: 'Sangat hemat memori karena tanpa populasi.',
      icon: 'feather',
    },
  ] as TraitCard[],
  pros: [
    {
      title: 'Menghindari Optimum Lokal',
      detail:
        'Secara sengaja menerima hasil yang lebih buruk pada tahap awal; mampu melewati penurunan performa demi menemukan tingkat efisiensi setinggi mungkin.',
    },
    {
      title: 'Menangani Kompleksitas Non-Linear',
      detail:
        'Tidak memerlukan ruang yang secara matematis mulus atau dapat diturunkan (diferensiabel) agar berfungsi efektif.',
    },
    {
      title: 'Fleksibel',
      detail:
        'Mampu mengoptimalkan berbagai tujuan yang saling bertentangan sekaligus — misalnya memaksimalkan throughput sekaligus meminimalkan biaya komputasi awan — dengan menggabungkannya ke dalam satu fungsi biaya.',
    },
    {
      title: 'Simpel dalam Implementasi',
      detail:
        'Relatif mudah diprogram, dikonfigurasi, dan diterapkan dalam skrip penalaan otomatis (auto-tuning) berbasis cloud yang mendasar.',
    },
  ] as ProConItem[],
  cons: [
    {
      title: 'Waktu Convergence Lambat',
      detail:
        'Mengharuskan evaluasi berbagai konfigurasi secara berurutan. Di lingkungan cloud, itu memakan waktu beberapa menit per iterasi sehingga keseluruhan proses tuning sangat lambat.',
    },
    {
      title: 'Biaya Infrastruktur Tinggi',
      detail:
        'Karena sengaja menguji konfigurasi kurang optimal pada tahap awal untuk mengeksplorasi lanskap, kinerja aplikasi dapat turun sementara atau sumber daya cloud yang mahal terbuang selama fase tuning.',
    },
    {
      title: 'Sensitivitas Hiperparameter',
      detail:
        'Keberhasilan sangat bergantung pada "suhu" awal, laju pendinginan, dan jumlah iterasi tiap penurunan suhu. Pengaturan tidak tepat dapat membuat algoritma melewatkan konfigurasi terbaik atau berjalan terlalu lama.',
    },
    {
      title: 'Tidak Ada Memori',
      detail:
        'SA standar tidak menyimpan memori konfigurasi sukses sebelumnya, sehingga bisa tidak sengaja menguji ulang status buruk yang serupa — kecuali dimodifikasi dengan daftar tabu atau riwayat.',
    },
  ] as ProConItem[],
  steps: [
    {
      numeral: 'I',
      title: 'Menghitung Beban Node (Matriks ETC)',
      kicker: 'Menyusun matriks ETC',
      latex: 'ETC(i,j) = \\text{waktu eksekusi tugas } t_i \\text{ pada node } n_j',
      paragraphs: [
        'Sekumpulan task dijalankan pada beberapa komputer (node). Tiap node punya kecepatan berbeda sehingga waktu komputasi tiap task berbeda di tiap node. Tujuannya: membagi task ke node yang sesuai agar tidak ada satu node yang terlalu lama menyelesaikan seluruh tugasnya.',
        'Matriks ETC mencatat waktu eksekusi setiap tugas pada setiap node. Dari tabel inilah seluruh perhitungan SA diskret bertumpu.',
      ],
      bullets: [
        { term: 'ETC(1,1) = 4', text: 't1 memerlukan 4 satuan waktu pada node 1.' },
        { term: 'ETC(2,2) = 3', text: 't2 memerlukan 3 satuan waktu pada node 2.' },
        { term: 'ETC(3,3) = 2', text: 't3 memerlukan 2 satuan waktu pada node 3.' },
      ],
      plate: 'sa-etc',
      caption: 'Matriks ETC: empat task, tiga node, dua belas nilai waktu eksekusi.',
    },
    {
      numeral: 'II',
      title: 'Representasi Solusi',
      kicker: 'Menuliskan penempatan',
      latex: 'S = [s_1, s_2, \\ldots, s_Y]',
      paragraphs: [
        'Y adalah jumlah tugas dan s_i adalah nomor node tempat tugas t_i dikerjakan. Representasi ini memudahkan perubahan penempatan tugas dan perhitungan biaya, sekaligus menjadi titik awal pencarian.',
      ],
      bullets: [
        { term: 'S = [1, 2, 3, 1]', text: 't1 di node 1, t2 di node 2, t3 di node 3, t4 di node 1.' },
      ],
      plate: 'sa-solution',
      caption: 'Satu larik, empat keputusan: setiap angka menunjuk node tempat tugas dikerjakan.',
    },
    {
      numeral: 'III',
      title: 'Total Waktu Eksekusi per Node',
      kicker: 'Menjumlahkan beban tiap node',
      latex: 'C_j(S) = \\sum_{i=1}^{Y} ETC(i,j)\\,\\mathbf{1}(s_i = j)',
      paragraphs: [
        'Fungsi indikator 1(s_i = j) bernilai 1 jika tugas i ditempatkan pada node j, dan 0 jika tidak. Hanya waktu tugas yang benar-benar dialokasikan ke node itu yang dijumlahkan.',
      ],
      example: {
        label: 'Contoh slide',
        latex: 'C_1 = ETC(1,1) + ETC(4,1) = 4 + 5 = 9',
        note: 'Untuk S = [1,2,3,1] juga C_2 = 3 dan C_3 = 2.',
      },
      plate: 'sa-loads',
      caption: 'Tiga batang: tinggi setiap batang adalah total waktu tugas yang ditempatkan pada node tersebut.',
    },
    {
      numeral: 'IV',
      title: 'Menghitung Cost Solution Function',
      kicker: 'Menghitung makespan',
      latex: 'f(S) = \\max_{j=1,\\ldots,N} C_j(S)',
      paragraphs: [
        'f(S) adalah cost atau makespan solusi S, C_j(S) total waktu tugas yang dialokasikan ke node j, dan N jumlah node.',
        'Mengapa maksimum? Karena seluruh tugas baru selesai ketika node dengan beban terbesar telah menyelesaikan tugasnya — dengan asumsi tugas independen dan setiap node menjalankan tugasnya secara berurutan.',
      ],
      example: {
        label: 'Contoh slide',
        latex: 'f(S_0) = \\max(9, 3, 2) = 9',
      },
      note: 'Slide asli memberi nomor "3" pada langkah ini juga; di sini dipecah menjadi langkah III dan IV agar urutan jelas.',
      plate: 'sa-cost',
      caption: 'Garis makespan berada di puncak batang tertinggi — saat node tersibuk selesai, seluruh tugas selesai.',
    },
    {
      numeral: 'V',
      title: 'Menentukan Temperatur Awal',
      kicker: 'Menghitung T₀ dari HEC',
      latex: 'T_0 = -\\frac{\\overline{\\Delta C}}{\\ln(HEC)}',
      paragraphs: [
        'Temperatur awal T0 mengendalikan seberapa berani SA menerima solusi yang lebih buruk. Pada temperatur tinggi, solusi buruk relatif mudah diterima; pada temperatur rendah, solusi buruk semakin sulit diterima.',
        'ΔC̄ adalah rata-rata kenaikan cost dari perpindahan yang memperburuk solusi, HEC target probabilitas penerimaan solusi yang lebih buruk, dan ln logaritma natural.',
      ],
      example: {
        label: 'Contoh slide',
        latex:
          '\\overline{\\Delta C} = 2,\\; HEC = 0{,}9 \\;\\Rightarrow\\; T_0 = -\\frac{2}{\\ln(0{,}9)} \\approx 18{,}98',
      },
      plate: 'sa-temp0',
      caption: 'Termometer: temperatur awal T₀ ≈ 18,98 dihitung dari ΔC̄ = 2 dan HEC = 0,9.',
    },
    {
      numeral: 'VI',
      title: 'Membentuk Neighbor Solution',
      kicker: 'Enam jenis perturbation',
      paragraphs: [
        'SA tidak mengganti semua tugas secara sembarangan tiap iterasi. Ia memakai operasi perturbation — perubahan terhadap solusi yang sudah ada. Slide menampilkan enam jenis perturbation pada tugas t1…t5 dan node n1…n4.',
      ],
      bullets: [
        { term: 'New Node Insertion', text: 'satu tugas dipindah ke node baru' },
        { term: 'Swap', text: 'dua tugas bertukar node' },
        { term: 'Random Shuffle', text: 'sebagian tugas diacak penempatannya' },
        { term: 'Displacement', text: 'sekelompok penempatan digeser' },
        { term: 'Insertion', text: 'satu penempatan diambil dan disisipkan ke posisi lain' },
        { term: 'Inversion', text: 'urutan sebuah segmen penempatan dibalik' },
      ],
      note: 'Deskripsi tiap operator adalah interpretasi dari diagram slide; diimplementasikan sebagai operator pada larik S.',
      plate: 'sa-neighbor',
      caption: 'Enam pola perturbation: dari memindahkan satu tugas hingga membalik urutan segmen.',
    },
    {
      numeral: 'VII',
      title: 'Menghitung Perubahan Cost',
      kicker: 'Menghitung selisih cost',
      latex: '\\Delta C = C_{next} - C_{cur}',
      paragraphs: [
        'Setelah neighbor terbentuk, hitung selisih cost solusi baru dan solusi saat ini. Tanda ΔC menentukan langkah berikutnya.',
      ],
      bullets: [
        { term: 'ΔC < 0', text: 'Cost turun — terima solusi baru.' },
        { term: 'ΔC = 0', text: 'Cost tetap — terima solusi baru.' },
        { term: 'ΔC > 0', text: 'Cost naik — uji probabilitas penerimaan.' },
      ],
      plate: 'sa-delta',
      caption: 'Setiap neighbor dibandingkan cost-nya sebelum diterima atau ditolak.',
    },
    {
      numeral: 'VIII',
      title: 'Probabilitas Penerimaan Solusi Buruk',
      kicker: 'Kriteria Metropolis',
      latex: 'P = \\exp\\left(-\\frac{\\Delta C}{T}\\right) \\quad \\text{untuk } \\Delta C > 0',
      paragraphs: [
        'Inilah bagian yang membedakan SA dari metode pencarian yang selalu memilih solusi terbaik pada setiap langkah. P adalah probabilitas penerimaan, ΔC kenaikan cost, dan T temperatur saat ini; exp(x) = e^x dengan e ≈ 2,71828.',
        'Algoritma menghasilkan bilangan acak r antara 0 dan 1. Solusi yang lebih buruk diterima apabila bilangan acak kurang dari exp(−ΔC/T).',
      ],
      example: {
        label: 'Keputusan',
        latex:
          '\\begin{cases} \\text{Terima}, & r < P \\\\ \\text{Tolak}, & r \\ge P \\end{cases}',
      },
      plate: 'sa-metropolis',
      caption: 'Meteran setengah lingkaran: jika bilangan acak r < P, solusi yang lebih buruk diterima.',
    },
    {
      numeral: 'IX',
      title: 'Memperbarui Solusi Saat Ini dan Terbaik',
      kicker: 'Memperbarui S_cur dan S_best',
      paragraphs: [
        'Jika neighbor diterima: S_cur ← S_next. Kemudian, jika f(S_cur) < f(S_best) maka S_best ← S_cur.',
        'Solusi yang diterima belum tentu terbaik: SA bisa menerima cost lebih tinggi untuk memperluas pencarian, tetapi solusi terbaik yang pernah ditemukan tetap disimpan. Jika neighbor ditolak, solusi saat ini tetap seperti semula.',
      ],
      plate: 'sa-best',
      caption: 'S_best tetap disimpan walaupun solusi saat ini sempat memburuk.',
    },
    {
      numeral: 'X',
      title: 'Menurunkan Temperatur & Mengulangi',
      kicker: 'Cooling schedule dan perulangan',
      latex: 'T_{baru} = \\alpha\\, T_{lama}',
      paragraphs: [
        'Setelah sejumlah pencarian pada satu temperatur selesai, temperatur diturunkan. α adalah cooling rate antara 0 dan 1. Inner loop mengatur berapa kali solusi tetangga dicoba pada temperatur tertentu; outer loop mengatur penurunan temperatur dan kapan algoritma dihentikan.',
        'Kondisi penghentian dasar: T < T_final dengan T_final = 0,01, kecuali dihentikan lebih awal oleh kondisi lain. Keluaran akhirnya adalah S_best.',
      ],
      example: {
        label: 'Contoh slide — α = 0,998, T_lama = 10',
        latex:
          'T_1 = 9{,}98 \\quad T_2 = 9{,}96004 \\quad T_3 = 10 \\times 0{,}998^3 \\approx 9{,}94012',
        note: 'Pengaruh temperatur (ΔC = 4): T = 10 → P ≈ 0,6703; T = 1 → P ≈ 0,0183. Semakin rendah temperatur, semakin kecil peluang menerima solusi yang memperburuk cost.',
      },
      plate: 'sa-cool',
      caption: 'Kurva pendinginan eksponensial: α menentukan seberapa cepat temperatur turun.',
    },
  ] as WorkStep[],
} as const

export const comparison = {
  rows: [
    { aspect: 'Basis pencarian', jaya: 'Populasi — banyak kandidat sekaligus', sa: 'Solusi tunggal — satu titik berjalan' },
    { aspect: 'Inspirasi', jaya: 'Kemenangan: menuju terbaik, menjauhi terburuk', sa: 'Pendinginan logam (annealing)' },
    { aspect: 'Parameter utama', jaya: 'Ukuran populasi, jumlah iterasi', sa: 'T0, α, inner loop, T_final' },
    { aspect: 'Penggunaan memori', jaya: 'Lebih besar (menyimpan populasi)', sa: 'Rendah (tanpa populasi)' },
    { aspect: 'Penerimaan solusi buruk', jaya: 'Tidak — seleksi greedy', sa: 'Ya, via kriteria Metropolis' },
    { aspect: 'Risiko utama', jaya: 'Kehilangan variasi, terjebak optimum lokal', sa: 'Lambat, sensitif terhadap hiperparameter' },
    { aspect: 'Kekuatan utama', jaya: 'Eksplorasi paralel, konvergensi cepat', sa: 'Mampu melewati optimum lokal, fleksibel' },
    { aspect: 'Keluaran', jaya: 'P_best — kandidat terbaik', sa: 'S_best — solusi terbaik yang pernah ditemukan' },
  ],
}

export const references = [
  {
    authors: 'Kaushik Mishra, Jharashree Pati, Santosh Kumar Majhi',
    year: '2020',
    title: 'A dynamic load scheduling in IaaS cloud using binary JAYA algorithm',
    source: 'Journal of King Saud University – Computer and Information Sciences, 34 (2022), 4914–4930.',
  },
  {
    authors: 'Esra Celik, Deniz Dal',
    year: '2021',
    title: 'A novel simulated annealing-based optimization approach for cluster-based task scheduling',
    source: 'Cluster Computing (2021) 24, 2927–2956.',
  },
]

export const accuracyNotes = [
  'Penomoran SA: slide memiliki dua langkah bernomor "3" (total waktu eksekusi, lalu cost function). Di website dipecah menjadi langkah III dan IV sehingga totalnya 10 langkah; langkah mengulangi pencarian digabung dengan penurunan temperatur di langkah X.',
  'Fitness JAYA: F1 = (1/MS) × ARU × AT makin besar makin baik, sedangkan P_best dipilih dari F minimum. Ini ketidakkonsistenan arah optimasi pada materi. Simulator memakai fungsi objektif minimasi yang jelas (Sphere/Rastrigin dan sejenisnya).',
  'Kriteria berhenti JAYA: slide menyebut berhenti ketika P_best dan P_worst tidak berubah. Simulator menambahkan batas iterasi maksimum sebagai praktik standar dan menampilkan keduanya.',
  'JAYA pada penjadwalan menghasilkan nilai kontinu yang harus dibulatkan/dikonversi ke nomor VM bilangan bulat. Demo memakai round() + clamp ke [1, jumlah VM].',
  'Rumus pembaruan JAYA memakai |X|; dipertahankan persis seperti slide.',
  'Istilah di UI diseragamkan: algoritma, metaheuristik.',
]

export const navSections = [
  { id: 'gerbang', label: 'Awal', style: 'Pendahuluan' },
  { id: 'peta', label: 'Daftar Isi', style: 'Daftar Isi' },
  { id: 'pengantar', label: 'Pengantar', style: 'Pengantar' },
  { id: 'jaya', label: 'JAYA', style: 'Algoritma JAYA' },
  { id: 'sa', label: 'SA', style: 'Simulated Annealing' },
  { id: 'arena', label: 'Perbandingan', style: 'Perbandingan' },
  { id: 'arsip', label: 'Referensi', style: 'Referensi' },
  { id: 'penutup', label: 'Penutup', style: 'Penutup' },
]