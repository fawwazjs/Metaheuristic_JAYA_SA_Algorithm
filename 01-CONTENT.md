# 01 — KONTEN (Sumber Kebenaran dari PDF)

> Semua teks, rumus, dan angka di bawah berasal dari presentasi "Metaheuristik — Algoritma JAYA dan Simulated Annealing (SA)", Kelompok 4 Kelas C, Institut Teknologi Sepuluh Nopember (ITS).
> Simpan sebagai data terstruktur di `src/lib/content.ts`. Rumus ditulis dalam LaTeX untuk KaTeX.

---

## A. Identitas

- **Judul:** METAHEURISTIK
- **Subjudul:** Algoritma JAYA dan Simulated Annealing (SA)
- **Kelompok:** Kelompok 4 Kelas C
- **Institusi:** Institut Teknologi Sepuluh Nopember
- **Anggota:**
  | Nama | NRP |
  |---|---|
  | I Dewa Made Satya Raditya | 5027231051 |
  | Ahmad Wildan Fawwaz | 5027241001 |
  | Muhammad Rakha Hananditya Rauf | 5027241015 |
  | Theodorus Aaron Ugraha | 5027241056 |
  | M. Hikari Reiziq Rakhmadinta | 5027241079 |

> Catatan desain: jangan memakai logo ITS asli atau foto kampus. Tampilkan nama institusi sebagai teks saja.

## B. Daftar Isi
- Algoritma JAYA: Definisi · Karakteristik · Keunggulan & Kelemahan · Cara Kerja
- Algoritma SA: Definisi · Karakteristik · Keunggulan & Kelemahan · Cara Kerja

---

## C. ALGORITMA JAYA

### C.1 Definisi
JAYA adalah algoritma metaheuristika **berbasis populasi** yang diperkenalkan oleh **R.V. Rao pada tahun 2016**.
Nama berasal dari bahasa **Sansekerta** yang berarti **Kemenangan** atau **Keberhasilan** untuk mencapai solusi terbaik.

### C.2 Filosofi
- **Mendekati Solusi Terbaik:** bergerak menuju kandidat terbaik.
- **Menjauhi Solusi Terburuk:** menghindari lokasi kandidat terburuk.

(Konteks di slide: JAYA diterapkan pada penjadwalan task ke VM di cloud IaaS. Ilustrasi arsitektur: user mengirim request → scheduler dengan algoritma JAYA & QoS metrics → task buffer → resource monitor/load balancer → datacenter/cluster/host → alokasi task ke VM.)

### C.3 Karakteristik (4 kartu)
| Judul | Deskripsi |
|---|---|
| Bebas Parameter Spesifik | Tanpa tuning parameter spesifik algoritma. |
| Berbasis Populasi | Mengelola banyak kandidat solusi bersamaan. |
| Konvergensi Cepat | Efisiensi komputasi tinggi untuk fungsi kompleks. |
| Mudah Diimplementasi | Logika pembaruan sederhana dan efisien. |

### C.4 Keunggulan JAYA
1. **Unggul di Makespan dan Resource Utilization** — task selesai lebih cepat dan VM terpakai lebih merata dibanding GA dan BPSO.
2. **Bebas Parameter Spesifik** — tidak perlu tuning khusus seperti SA, cukup ukuran populasi dan jumlah iterasi.
3. **Simpel** — satu rumus pembaruan, tanpa crossover atau mutasi.
4. **Eksplorasi dan Eksploitasi Seimbang** — mendekati solusi terbaik sambil menjauhi solusi terburuk.
5. **Fleksibel** — fitness bisa memuat makespan, utilisasi, dan energi, serta mudah digabung load balancing.

### C.5 Kelemahan JAYA
1. **Mudah Terjebak Optimum Lokal** — semua kandidat mengejar solusi terbaik yang sama, jadi variasi cepat habis.
2. **Perlu Konversi Kontinu ke Diskret** — hasil JAYA berupa desimal, padahal nomor VM harus bilangan bulat.
3. **Tanpa Load Balancing Bawaan** — hanya mengejar fitness, sehingga beban VM bisa timpang.
4. **Komputasi Berat** — semua kandidat dihitung ulang tiap iterasi, dan hasil bergantung pada ukuran populasi serta jumlah iterasi.
5. **Pengujian Terbatas** — paper hanya menguji lewat simulasi dengan task independen dan non-preemptive.

### C.6 Cara Kerja JAYA (stepper 5 langkah)

#### Langkah 1 — Inisiasi Populasi
JAYA memulai proses dengan membuat beberapa kandidat solusi, yaitu beberapa kemungkinan pemetaan *task* ke VM yang nantinya dibandingkan untuk memperoleh pemetaan terbaik. Nilai awal setiap kandidat dibangkitkan secara acak:

```latex
X_0^k = X_{min} + (X_{max} - X_{min}) \times r
```
- `X_0^k` = nilai awal kandidat solusi
- `X_min` = batas minimum nilai yang diperbolehkan
- `X_max` = batas maksimum nilai yang diperbolehkan
- `r` = bilangan acak dengan rentang 0–1

`X_min` dan `X_max` ditentukan dari ruang solusi yang diperbolehkan, yakni batas penempatan *task* sesuai jumlah VM yang tersedia, sehingga tidak ada kandidat solusi yang merepresentasikan penempatan pada VM yang tidak ada.

#### Langkah 2 — Evaluasi Fitness
Setiap kandidat diberi **nilai fitness**: seberapa baik pemetaan task–VM memenuhi tujuan optimasi. *Fitness function* tidak punya satu rumus tetap dalam JAYA karena disesuaikan dengan masalah; salah satu rumusnya:

**(a) Completion Time (CT)** pasangan task–VM:
```latex
CT_{ij} = \frac{Len_i}{PT_j}
```
- `CT_ij` = waktu penyelesaian task ke-i pada VM ke-j
- `Len_i` = jumlah instruksi pada task ke-i (MI)
- `PT_j` = kemampuan pemrosesan VM ke-j

**(b) Execution Time (ET)** tiap VM = jumlah CT seluruh task yang dialokasikan ke VM tersebut:
```latex
ET_j = \sum_{i=1}^{n} X_{ij} \times CT_{ij}
```
- `ET_j` = total waktu eksekusi VM ke-j
- `n` = jumlah task
- `X_ij = 1` jika task ke-i dialokasikan ke VM ke-j, `0` jika tidak

**(c) Komponen fitness F1 dan F2** dari empat metrik: *Makespan (MS)*, *Average Resource Utilization (ARU)*, *Average Throughput (AT)*, *Energy Consumption (EC)*:
```latex
MS = \max(ET_j)
\qquad
F_1 = \frac{1}{MS} \times ARU \times AT
\qquad
F_2 = \sum_{j=1}^{m} EC_j
```
- `MS` = waktu penyelesaian terlama di antara seluruh VM
- `ARU` = rata-rata tingkat pemanfaatan VM
- `AT` = rata-rata throughput sistem
- `EC_j` = energi yang dikonsumsi VM ke-j
- `m` = jumlah VM

`F1` menilai performa waktu dan pemanfaatan resource, sedangkan `F2` menghitung total konsumsi energi kandidat.

**(d) Nilai fitness akhir:**
```latex
F = (F_1 \times \omega_1) + (F_2 \times \omega_2)
```
- `F` = nilai fitness kandidat pemetaan task–VM
- `ω1` = bobot komponen F1 (rentang 0–1)
- `ω2` = bobot komponen F2 (rentang 0–1)

Seluruh kandidat dibandingkan berdasarkan `F`:
- `P_best` = kandidat dengan nilai F **minimum** (`argmin_k F_k`)
- `P_worst` = kandidat dengan nilai F **maksimum** (`argmax_k F_k`)

Semakin kecil `F`, semakin baik kualitas pemetaan. `P_best` dipakai untuk mengarahkan kandidat menuju solusi lebih baik; `P_worst` dipakai untuk menjauhkan kandidat dari solusi buruk. Keduanya digunakan pada pembaruan kandidat iterasi berikutnya.

#### Langkah 3 — Pembaruan Kandidat Solusi
Setelah `P_best` dan `P_worst` diperoleh, setiap kandidat diperbarui agar bergerak mendekati solusi terbaik dan menjauhi solusi terburuk:
```latex
X_i^{k+1} = X_i^k + r_1\left(P_{best_i} - |X_i^k|\right) - r_2\left(P_{worst_i} - |X_i^k|\right)
```
- `X_i^k` = nilai penempatan task ke-i pada iterasi ke-k
- `X_i^{k+1}` = nilai baru penempatan task ke-i setelah diarahkan mendekati P_best dan menjauhi P_worst
- `P_best_i` = nilai penempatan task ke-i pada kandidat terbaik
- `P_worst_i` = nilai penempatan task ke-i pada kandidat terburuk
- `r1` = bilangan acak 0–1, mengatur besar pengaruh P_best
- `r2` = bilangan acak 0–1, mengatur besar pengaruh P_worst
- `k` = indeks iterasi; `i` = indeks task yang sedang diperbarui

**Contoh (WAJIB dijadikan contoh interaktif & unit test):**
Pada iterasi ke-k, Task 2: `X_2^k = 2` (saat ini di VM ke-2), `P_best_2 = 3` (kandidat terbaik: VM ke-3), `P_worst_2 = 1` (kandidat terburuk: VM ke-1), `r1 = r2 = 0,5`.
```latex
X_2^{k+1} = 2 + 0{,}5\,(3 - |2|) - 0{,}5\,(1 - |2|)
          = 2 + 0{,}5(1) - 0{,}5(-1)
          = 3
```
Artinya Task 2 berpindah dari VM ke-2 ke VM ke-3: bergerak menuju P_best dan menjauhi P_worst.

#### Langkah 4 — Seleksi Solusi
Setelah kandidat baru `X_i^{k+1}` diperoleh, fitness-nya dibandingkan dengan kandidat sebelumnya `X_i^k`. Syarat:
```latex
F\left(X^{k+1}\right) < F\left(X^{k}\right)
```
Jika fitness kandidat baru lebih kecil (lebih baik), `X^{k+1}` diterima dan menggantikan kandidat sebelumnya. Jika tidak, `X^k` dipertahankan. Tujuan: pembaruan hanya dipertahankan jika menghasilkan solusi yang lebih baik, sehingga kualitas populasi tidak menurun pada iterasi berikutnya.

#### Langkah 5 — Iterasi
Kandidat yang dipertahankan menjadi populasi iterasi berikutnya, lalu seluruh kandidat dievaluasi kembali untuk menentukan `P_best` dan `P_worst` yang baru. Proses yang diulang:

`Evaluasi Fitness → Mendapatkan P_best, P_worst → Pembaruan Kandidat → Seleksi Solusi`

Nilai `P_best` dan `P_worst` dapat berubah tiap iterasi karena kualitas kandidat berubah. Menurut slide, proses dihentikan jika posisi `P_best` dan `P_worst` sudah tidak berubah lagi (pembaruan tidak lagi menghasilkan perubahan). Setelah kondisi berhenti tercapai, `P_best` menjadi solusi akhir: **pemetaan task–VM terbaik yang diperoleh selama proses optimasi**.

---

## D. ALGORITMA SIMULATED ANNEALING (SA)

### D.1 Definisi
**Simulated Annealing (SA)** adalah algoritma metaheuristika **berbasis solusi tunggal** yang disimulasikan dari proses fisik pendinginan logam.
Terinspirasi dari teori fisika (**Metalurgi**): proses memanaskan logam hingga suhu tinggi lalu mendinginkannya perlahan untuk mencapai struktur kristal berenergi minimum.

### D.2 Karakteristik (4 kartu)
| Judul | Deskripsi |
|---|---|
| Single-Solution | Memproses satu titik solusi dalam satu waktu. |
| Kriteria Metropolis | Menerima solusi buruk berdasarkan probabilitas `P = e^{-ΔE/T}`. |
| Jadwal Pendinginan | Suhu diturunkan bertahap (misal `T = α × T`). |
| Penggunaan Memori Rendah | Sangat hemat memori karena tanpa populasi. |

### D.3 Keunggulan SA
1. **Menghindari Optimum Lokal** — secara sengaja menerima hasil yang lebih buruk pada tahap awal; mampu melewati penurunan performa demi menemukan tingkat efisiensi setinggi mungkin.
2. **Menangani Kompleksitas Non-Linear** — tidak memerlukan ruang yang secara matematis mulus atau dapat diturunkan (diferensiabel) agar berfungsi efektif.
3. **Fleksibel** — mampu mengoptimalkan berbagai tujuan yang saling bertentangan secara bersamaan (mis. memaksimalkan throughput sekaligus meminimalkan biaya komputasi awan) dengan menggabungkannya ke dalam satu fungsi biaya.
4. **Simpel dalam Implementasi** — relatif mudah diprogram, dikonfigurasi, dan diterapkan dalam skrip penalaan otomatis (auto-tuning) berbasis cloud yang mendasar.

### D.4 Kelemahan SA
1. **Waktu convergence lambat** — mengharuskan evaluasi berbagai konfigurasi secara berurutan. Di lingkungan cloud, itu memakan waktu beberapa menit per iterasi, sehingga keseluruhan proses tuning sangat lambat.
2. **Biaya infrastruktur tinggi** — karena sengaja menguji konfigurasi kurang optimal ("lebih buruk") pada tahap awal untuk mengeksplorasi lanskap, kinerja aplikasi dapat turun sementara atau sumber daya cloud yang mahal terbuang selama fase tuning.
3. **Sensitivitas hiperparameter** — keberhasilan sangat bergantung pada parameternya sendiri: "suhu" awal, laju pendinginan, dan jumlah iterasi tiap penurunan suhu. Pengaturan tidak tepat dapat membuat algoritma melewatkan konfigurasi terbaik atau berjalan terlalu lama.
4. **Tidak ada memori** — SA standar tidak menyimpan memori konfigurasi sukses sebelumnya, sehingga bisa tidak sengaja menguji ulang status buruk yang serupa, kecuali dimodifikasi dengan daftar tabu atau riwayat.

### D.5 Cara Kerja SA (stepper 10 langkah)

**Kerangka masalah:** Sekumpulan task dijalankan beberapa komputer (node). Tiap komputer punya kecepatan berbeda sehingga waktu komputasi tiap task berbeda di tiap komputer. Tujuan: membagi task ke komputer yang sesuai agar tidak ada satu komputer yang terlalu lama menyelesaikan seluruh tugasnya. SA dipakai untuk mencari solusi baik dalam waktu wajar tanpa memeriksa semua kemungkinan.

#### Langkah 1 — Menghitung Beban Node (matriks ETC)
```latex
ETC(i,j) = \text{waktu eksekusi tugas } t_i \text{ pada node } n_j
```
**Data contoh (gunakan persis ini sebagai dataset demo):**

| Task | Node 1 | Node 2 | Node 3 |
|---|---|---|---|
| t1 | 4 | 6 | 9 |
| t2 | 7 | 3 | 5 |
| t3 | 8 | 4 | 2 |
| t4 | 5 | 7 | 4 |

- ETC(1,1)=4: t1 memerlukan 4 satuan waktu pada node 1.
- ETC(2,2)=3: t2 memerlukan 3 satuan pada node 2.
- ETC(3,3)=2: t3 memerlukan 2 satuan pada node 3.

#### Langkah 2 — Representasi Solusi
```latex
S = [s_1, s_2, \ldots, s_Y]
```
- `Y` = jumlah tugas
- `s_i` = nomor node tempat tugas `t_i` dikerjakan

Representasi ini memudahkan perubahan penempatan tugas dan perhitungan biaya, dan juga menjadi titik awal pencarian.

**Contoh:** `S = [1, 2, 3, 1]` → t1 di node 1, t2 di node 2, t3 di node 3, t4 di node 1.

#### Langkah 3 — Total waktu eksekusi tugas-tugas (beban per node)
```latex
C_j(S) = \sum_{i=1}^{Y} ETC(i,j)\,\mathbf{1}(s_i = j)
```
Fungsi indikator `1(s_i = j)` bernilai 1 jika tugas i ditempatkan pada node j, dan 0 jika tidak: hanya waktu tugas yang benar-benar dialokasikan ke node itu yang dijumlahkan.

**Contoh:** `C_1 = ETC(1,1) + ETC(4,1) = 4 + 5 = 9` (juga `C_2 = 3`, `C_3 = 2`).

#### Langkah 4 (di slide bernomor 3 kedua) — Menghitung Cost Solution Function
```latex
f(S) = \max_{j=1,\ldots,N} C_j(S)
```
- `f(S)` = cost atau **makespan** solusi S
- `C_j(S)` = total waktu tugas yang dialokasikan ke node j
- `N` = jumlah node

Mengapa maksimum? Karena seluruh tugas baru selesai ketika node dengan beban terbesar telah menyelesaikan tugasnya, dengan asumsi tugas independen dan setiap node menjalankan tugasnya secara berurutan.

**Contoh:** `f(S_0) = max(9, 3, 2) = 9`.

#### Langkah 5 — Menentukan Temperatur Awal
Temperatur awal `T0` mengendalikan seberapa berani SA menerima solusi yang lebih buruk.
- Temperatur tinggi: solusi yang lebih buruk relatif mudah diterima.
- Temperatur rendah: solusi yang lebih buruk semakin sulit diterima.

```latex
T_0 = -\frac{\overline{\Delta C}}{\ln(HEC)}
```
- `ΔC̄` = rata-rata kenaikan cost dari perpindahan yang memperburuk solusi
- `HEC` = target probabilitas penerimaan solusi yang lebih buruk
- `ln` = logaritma natural

**Contoh:** dari sampel perpindahan yang memperburuk solusi, rata-rata kenaikan cost = 2 satuan; target `H = 0,9`:
```latex
T_0 = -\frac{2}{\ln(0{,}9)} \approx 18{,}98
```

#### Langkah 6 — Membentuk Neighbor Solution
SA tidak mengganti semua tugas secara sembarangan tiap iterasi. Ia memakai operasi **perturbation**, yaitu perubahan terhadap solusi yang sudah ada. Slide menampilkan **6 jenis perturbation** (ilustrasi dengan tugas t1…t5 dan node n1…n4):
- (a) **New Node Insertion** — satu tugas dipindah ke node baru
- (b) **Swap** — dua tugas bertukar node
- (c) **Random Shuffle** — sebagian tugas diacak penempatannya
- (d) **Displacement** — sekelompok penempatan digeser
- (e) **Insertion** — satu penempatan diambil dan disisipkan ke posisi lain
- (f) **Inversion** — urutan sebuah segmen penempatan dibalik

(Deskripsi singkat tiap operator di atas adalah interpretasi dari diagram slide; implementasikan sebagai operator pada array `S`.)

#### Langkah 7 — Menghitung Perubahan Cost
Setelah neighbor terbentuk, hitung selisih cost solusi baru dan solusi saat ini:
```latex
\Delta C = C_{next} - C_{cur}
```
| Kondisi | Makna | Keputusan |
|---|---|---|
| ΔC < 0 | Cost turun | Terima solusi baru |
| ΔC = 0 | Cost tetap | Terima solusi baru |
| ΔC > 0 | Cost naik | Uji probabilitas penerimaan |

#### Langkah 8 — Probabilitas Penerimaan Solusi yang Lebih Buruk
Bagian yang membedakan SA dari metode pencarian yang selalu memilih solusi terbaik pada setiap langkah.
```latex
P = \exp\left(-\frac{\Delta C}{T}\right) \quad \text{untuk } \Delta C > 0
```
- `P` = probabilitas penerimaan; `ΔC` = kenaikan cost; `T` = temperatur saat ini
- `exp(x) = e^x`, dengan `e ≈ 2,71828`

Algoritma menghasilkan bilangan acak `r` antara 0 dan 1:
```latex
\begin{cases} \text{Terima}, & r < P \\ \text{Tolak}, & r \ge P \end{cases}
```
Solusi yang lebih buruk diterima apabila bilangan acak kurang dari `exp(-ΔC/T)`.

#### Langkah 9 — Memperbarui Solusi Saat Ini dan Solusi Terbaik
Jika neighbor diterima: `S_cur ← S_next`. Kemudian, jika `f(S_cur) < f(S_best)` maka `S_best ← S_cur`.
Solusi yang diterima belum tentu terbaik: SA bisa menerima cost lebih tinggi untuk memperluas pencarian, tetapi solusi terbaik yang pernah ditemukan tetap disimpan. Jika neighbor ditolak, solusi saat ini tetap seperti semula.

#### Langkah 10 — Menurunkan Temperatur (Cooling Schedule) & Mengulangi
Setelah sejumlah pencarian pada satu temperatur selesai:
```latex
T_{baru} = \alpha\, T_{lama}
```
- `α` = cooling rate, nilai antara 0 dan 1
- `T_lama` = temperatur sebelum penurunan; `T_baru` = setelah penurunan

**Contoh:** `α = 0,998`, `T_lama = 10`:
- `T1 = 0,998 × 10 = 9,98`
- `T2 = 0,998 × 9,98 = 9,96004`
- `T3 = 10 × 0,998³ ≈ 9,94012`

Pengaruh temperatur (ΔC = 4): pada `T = 10`, `P = e^{-4/10} ≈ 0,6703`; pada `T = 1`, `P = e^{-4/1} ≈ 0,0183`. **Semakin rendah temperatur, semakin kecil peluang SA menerima solusi yang memperburuk cost.**

**Struktur perulangan:**
- *Inner loop*: mengatur berapa kali solusi tetangga dicoba pada temperatur tertentu.
- *Outer loop*: mengatur penurunan temperatur dan kapan algoritma dihentikan.

**Kondisi penghentian dasar:** `T < T_final`, dengan `T_final = 0,01` (kecuali dihentikan lebih awal oleh kondisi lain). Keluaran akhir: **`S_best`**.

---

## E. Referensi
1. Kaushik Mishra, Jharashree Pati, Santosh Kumar Majhi (2020). *A dynamic load scheduling in IaaS cloud using binary JAYA algorithm*. Journal of King Saud University – Computer and Information Sciences, 34 (2022), 4914–4930.
2. Esra Celik, Deniz Dal (2021). *A novel simulated annealing-based optimization approach for clusterbased task scheduling*. Cluster Computing (2021) 24, 2927–2956.

## F. Penutup
"TERIMA KASIH — Kelompok 4 Kelas C"

---

## G. Catatan Akurasi & Hal yang Perlu Diperhatikan Agent

Angka contoh di atas sudah diverifikasi: JAYA contoh → 3; SA: C1=9, f(S0)=9, T0=−2/ln0,9≈18,98, P=e^{−0,4}≈0,6703 dan e^{−4}≈0,0183, T1=9,98, T2=9,96004, T3≈9,94012. Pakai sebagai **unit test**.

Beberapa hal di slide yang sebaiknya ditangani hati-hati (jangan mengubah isi slide, cukup tambah "Catatan" kecil di UI):

1. **Penomoran SA:** slide memiliki dua langkah bernomor "3" (total waktu eksekusi, lalu cost function). Di website dipecah menjadi langkah 3 dan 4 sehingga totalnya 10 langkah; langkah "Mengulangi pencarian sampai kondisi berhenti" digabung dengan penurunan temperatur di langkah 10. Boleh dibuat 11 langkah jika lebih jelas — yang penting urutan konten tetap.
2. **Fitness JAYA:** `F1 = (1/MS)×ARU×AT` nilainya makin besar makin baik, sedangkan `P_best` dipilih dari `F` minimum. Ini ketidakkonsistenan arah optimasi pada materi. Di **simulator**, gunakan fungsi objektif yang jelas (minimasi, mis. makespan atau fungsi uji Sphere/Rastrigin) dan beri catatan kecil: "Pada simulator, fitness didefinisikan sebagai nilai yang diminimalkan."
3. **Kriteria berhenti JAYA:** slide menyebut berhenti ketika P_best dan P_worst tidak berubah. Di simulator tambahkan juga batas iterasi maksimum (praktik standar) dan tampilkan keduanya.
4. **JAYA pada penjadwalan** menghasilkan nilai kontinu yang harus dibulatkan/dikonversi ke nomor VM bilangan bulat (kelemahan #2). Demonstrasikan dengan `round()` + *clamp* ke [1, jumlah VM].
5. Rumus update JAYA memakai `|X|`; pertahankan seperti slide.
6. Kata "algoritme/algoritma", "metaheuristika/metaheuristik" bervariasi di slide; di UI konsisten: **algoritma**, **metaheuristik**.
