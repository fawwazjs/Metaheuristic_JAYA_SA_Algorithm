# Penjadwalan Cloudlet dengan Simulated Annealing di CloudSim Plus

Proyek ini menerapkan algoritma **Simulated Annealing (SA)** untuk menjadwalkan *cloudlet* (tugas) ke *VM* pada simulator [CloudSim Plus](https://cloudsimplus.org/). Tujuan optimasinya adalah meminimalkan **makespan**, yaitu waktu selesai paling lambat dari seluruh cloudlet. Hasilnya dibandingkan dengan **baseline** (round-robin bawaan `DatacenterBrokerSimple`).

## Daftar Isi

- [Hasil Singkat](#hasil-singkat)
- [Cara Kerja](#cara-kerja)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Struktur Proyek](#struktur-proyek)
- [Konfigurasi pom.xml](#konfigurasi-pomxml)
- [Menjalankan Program](#menjalankan-program)
- [Parameter yang Bisa Diubah](#parameter-yang-bisa-diubah)
- [Troubleshooting](#troubleshooting)
- [Pengembangan Lanjutan](#pengembangan-lanjutan)

## Hasil Singkat

Skenario: 4 VM heterogen (500, 1000, 1500, 2000 MIPS, masing-masing 2 core) dan 20 cloudlet 1 core dengan panjang acak 5.000-20.000 MI.

| Mode | Makespan simulasi |
|---|---|
| Baseline (round-robin) | 66,00 detik |
| Simulated Annealing | 25,96 detik |

SA menurunkan makespan sekitar **60,7%**. Pada baseline, VM paling lambat (500 MIPS) mendapat jumlah tugas yang sama dengan VM tercepat sehingga menjadi penghambat. SA menyeimbangkan beban sehingga seluruh VM selesai pada kisaran 24-26 detik.

> Catatan: hasil ini berasal dari satu skenario dengan seed tetap. Untuk kesimpulan yang lebih kuat, jalankan dengan beberapa seed dan jumlah cloudlet yang berbeda.

## Cara Kerja

**Representasi solusi:** array integer, indeks = nomor cloudlet, nilai = nomor VM. Contoh `[2, 0, 1, 1]` berarti cloudlet 0 ke VM 2, cloudlet 1 ke VM 0, cloudlet 2 dan 3 ke VM 1.

**Alur SA:**

1. Mulai dari solusi acak dan suhu tinggi.
2. Buat solusi tetangga dengan memindahkan satu cloudlet ke VM acak.
3. Jika tetangga lebih baik, terima. Jika lebih buruk, tetap bisa diterima dengan peluang `e^(-Δ/T)`.
4. Turunkan suhu (`T = T × coolingRate`) sampai mencapai suhu minimum.
5. Kembalikan solusi terbaik yang pernah ditemukan.

**Fungsi fitness (estimasi makespan)** untuk tiap VM adalah nilai terbesar dari:

- `total panjang tugas di VM / (MIPS × jumlah core)`
- `panjang cloudlet terpanjang di VM / MIPS` (karena satu cloudlet 1 core tidak bisa dibagi ke core lain)

Makespan estimasi adalah nilai maksimum dari seluruh VM.

## Prasyarat

| Kebutuhan | Versi | Cek |
|---|---|---|
| JDK | 17 atau lebih baru | `java -version` |
| Maven | 3.8 atau lebih baru | `mvn -version` |
| VS Code | terbaru | - |
| Extension Pack for Java | terbaru | - |

## Instalasi

### 1. Instal JDK 17+

- **Windows:** unduh dari [Adoptium Temurin](https://adoptium.net/) lalu jalankan installer. Centang opsi **Set JAVA_HOME** dan **Add to PATH**.
- **Ubuntu/Debian:**
  ```bash
  sudo apt update
  sudo apt install openjdk-17-jdk
  ```
- **macOS:**
  ```bash
  brew install openjdk@17
  ```

Cek hasilnya:

```bash
java -version
```

### 2. Instal Maven

> Extension Pack for Java di VS Code **tidak** menginstal Maven ke sistem. Perintah `mvn` di terminal membutuhkan instalasi terpisah.

**Windows:**

1. Unduh *Binary zip archive* dari [maven.apache.org/download.cgi](https://maven.apache.org/download.cgi).
2. Ekstrak, misalnya ke `C:\apache-maven-3.9.x`.
3. Buka **Environment Variables**, lalu:
   - Pastikan `JAVA_HOME` mengarah ke folder JDK, misalnya `C:\Program Files\Eclipse Adoptium\jdk-17...`.
   - Tambahkan `C:\apache-maven-3.9.x\bin` ke variabel **Path**.
4. **Tutup dan buka ulang VS Code atau terminal** agar perubahan terbaca.

**Ubuntu/Debian:**

```bash
sudo apt install maven
```

**macOS:**

```bash
brew install maven
```

Cek hasilnya:

```bash
mvn -version
```

### 3. Instal VS Code dan extension

1. Instal [Visual Studio Code](https://code.visualstudio.com/).
2. Buka tab Extensions (`Ctrl+Shift+X`), cari dan instal **Extension Pack for Java** dari Microsoft.

### 4. Clone repositori

```bash
git clone https://github.com/USERNAME/NAMA-REPO.git
cd NAMA-REPO
code .
```

Ganti `USERNAME/NAMA-REPO` sesuai repositorimu. Pastikan kamu membuka folder yang berisi `pom.xml`.

## Struktur Proyek

```
demo/
├── pom.xml
└── src/
    └── main/
        └── java/
            └── com/
                └── example/
                    ├── App.java                 # Setup CloudSim + menjalankan simulasi
                    └── SimulatedAnnealing.java  # Implementasi algoritma SA
```

Baris `package` di kedua file harus sesuai folder (`package com.example;`).

## Konfigurasi pom.xml

Pastikan `pom.xml` berisi properti Java, dependency CloudSim Plus, dan plugin `exec-maven-plugin`:

```xml
<properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>

<dependencies>
    <dependency>
        <groupId>org.cloudsimplus</groupId>
        <artifactId>cloudsim-plus</artifactId>
        <version>8.0.0</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.codehaus.mojo</groupId>
            <artifactId>exec-maven-plugin</artifactId>
            <version>3.1.0</version>
            <configuration>
                <mainClass>com.example.App</mainClass>
            </configuration>
        </plugin>
    </plugins>
</build>
```

- Sesuaikan `<version>` CloudSim Plus dengan yang kamu pakai. Versi terbaru ada di [Maven Central](https://central.sonatype.com/artifact/org.cloudsimplus/cloudsim-plus).
- Versi 7.x ke bawah memakai package `org.cloudbus.cloudsim.*`, sedangkan versi 8.x memakai `org.cloudsimplus.*`.

## Menjalankan Program

### Cara 1: Lewat terminal (Maven)

Dari folder yang berisi `pom.xml`:

```bash
mvn clean compile exec:java
```

Jika `mainClass` tidak ditulis di `pom.xml`, gunakan argumen `-D`:

```bash
mvn clean compile exec:java -Dexec.mainClass=com.example.App
```

**Pengguna PowerShell (Windows):** beri tanda kutip pada argumen `-D`, kalau tidak PowerShell akan memecahnya di titik dan Maven error.

```powershell
mvn clean compile exec:java "-Dexec.mainClass=com.example.App"
```

### Cara 2: Lewat VS Code

1. Buka `App.java`.
2. Klik **Run** di atas method `main`.
3. Jika perubahan tidak terbaca, jalankan `Ctrl+Shift+P` lalu **Java: Clean Java Language Server Workspace**.

### Membandingkan SA dengan baseline

Di `App.java` ada saklar:

```java
private static final boolean USE_SA = true;
```

| Nilai | Mode |
|---|---|
| `true` | Memakai hasil Simulated Annealing |
| `false` | Baseline (round-robin bawaan broker) |

Jalankan program dua kali (sekali untuk tiap nilai), lalu bandingkan baris terakhir:

```
=== Mode: SIMULATED ANNEALING | Makespan simulasi: 25.96 detik ===
=== Mode: BASELINE | Makespan simulasi: 66.00 detik ===
```

### Contoh output

```
Makespan estimasi SA: 24.12 detik
...
|Cloudlet| Status|DC|Host|Host PEs |VM|   VM PEs|CloudletLen|...|FinishTime|ExecTime
|      13|SUCCESS| 1|   0|       16| 3|        2|       6263|...|      12.7|    12.6
...
=== Mode: SIMULATED ANNEALING | Makespan simulasi: 25.96 detik ===
```

Makespan sebenarnya adalah nilai **FinishTime terbesar** pada tabel hasil.

## Parameter yang Bisa Diubah

**Parameter SA** (di `App.java`):

```java
new SimulatedAnnealing(lengths, mips, vmPes, 100, 0.001, 0.95, 100);
//                                           |    |      |     |
//                                           |    |      |     +-- iterasi per level suhu
//                                           |    |      +-------- cooling rate
//                                           |    +--------------- suhu minimum
//                                           +-------------------- suhu awal
```

| Parameter | Efek |
|---|---|
| Suhu awal | Makin tinggi, makin banyak solusi buruk diterima di awal (eksplorasi lebih luas) |
| Suhu minimum | Batas berhenti pencarian |
| Cooling rate (0,90-0,99) | Makin dekat ke 1, pendinginan makin lambat dan hasil biasanya lebih baik, tetapi lebih lama |
| Iterasi per suhu | Makin besar, pencarian di tiap suhu makin teliti |

Skala suhu sebaiknya sebanding dengan skala selisih makespan (di sini puluhan detik).

**Parameter skenario** (di `App.java`):

- `mips`: kecepatan tiap VM, misalnya `{500, 1000, 1500, 2000}`.
- `vmPes`: jumlah core per VM.
- `lengths`: jumlah dan rentang panjang cloudlet.
- `new Random(1)`: seed pembuat cloudlet. `new Random(42)` di `SimulatedAnnealing.java` adalah seed SA. Ubah atau hapus angkanya untuk hasil yang berbeda.

## Troubleshooting

| Masalah | Penyebab dan solusi |
|---|---|
| `mvn` tidak dikenali | Maven belum terinstal atau folder `bin` belum masuk Path. Instal Maven, lalu restart terminal/VS Code. |
| `Unable to add module to the current project as it is not of packaging type 'pom'` | `mvn archetype:generate` dijalankan di dalam folder yang sudah berisi proyek. Jalankan dari folder lain, atau pakai proyek yang sudah ada. |
| `Unknown lifecycle phase ".mainClass=..."` | Masalah penulisan di PowerShell. Gunakan `"-Dexec.mainClass=com.example.App"` (dengan kutip) atau tulis `mainClass` di `pom.xml`. |
| `No plugin found for prefix 'exec'` | Plugin belum ada di `pom.xml`. Tambahkan `exec-maven-plugin`. |
| `package org.cloudsimplus... does not exist` | Dependency belum terunduh. Klik kanan `pom.xml` lalu **Reload Project**, atau jalankan `mvn clean install`. |
| Error versi Java | Pastikan JDK 17+. Atur lewat `Ctrl+Shift+P` lalu **Java: Configure Java Runtime**. |
| `App` tidak menemukan `SimulatedAnnealing` | Baris `package` tidak sama atau file berada di folder yang salah. Samakan `package` dan letakkan keduanya di `src/main/java/com/example/`. |
| Hasil SA dan baseline sama persis | Kemungkinan VM dan cloudlet identik (tidak ada yang bisa dioptimalkan), atau yang berjalan masih kode lama. Gunakan skenario heterogen dan jalankan `mvn clean compile exec:java`. |

## Pengembangan Lanjutan

- Jalankan eksperimen berulang dengan beberapa seed, lalu laporkan rata-rata, minimum, dan simpangan baku.
- Variasikan jumlah cloudlet (50, 100, 200) dan jumlah VM (4, 8, 16).
- Bandingkan dengan algoritma lain seperti Min-Min atau Genetic Algorithm.
- Tambahkan grafik konvergensi (nilai `bestCost` per level suhu).
- Tambahkan metrik lain: rata-rata waktu respons, utilisasi VM, *degree of imbalance*, atau konsumsi energi.

## Referensi

- [CloudSim Plus](https://cloudsimplus.org/)
- [cloudsimplus-examples](https://github.com/cloudsimplus/cloudsimplus-examples)
- [Apache Maven](https://maven.apache.org/)
