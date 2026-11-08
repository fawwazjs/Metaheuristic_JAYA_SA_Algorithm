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

### Output dengan algoritma baseline cloudsim (roundrobin)

```
================== Starting CloudSim Plus 8.0.0 ==================

INFO  0.00: DatacenterSimple1 is starting...
INFO  DatacenterBrokerSimple2 is starting...
INFO  Entities started.
INFO  0.00: DatacenterBrokerSimple2: List of 1 datacenters(s) received.
INFO  0.00: DatacenterBrokerSimple2: Trying to create Vm 0 in DatacenterSimple1
INFO  0.00: DatacenterBrokerSimple2: Trying to create Vm 1 in DatacenterSimple1
INFO  0.00: DatacenterBrokerSimple2: Trying to create Vm 2 in DatacenterSimple1
INFO  0.00: DatacenterBrokerSimple2: Trying to create Vm 3 in DatacenterSimple1
INFO  0.00: VmAllocationPolicySimple: Vm 0 has been allocated to Host 0/DC 1
INFO  0.00: VmAllocationPolicySimple: Vm 1 has been allocated to Host 0/DC 1
INFO  0.00: VmAllocationPolicySimple: Vm 2 has been allocated to Host 0/DC 1
INFO  0.00: VmAllocationPolicySimple: Vm 3 has been allocated to Host 0/DC 1
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 0 to Vm 0 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 1 to Vm 1 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 2 to Vm 2 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 3 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 4 to Vm 0 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 5 to Vm 1 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 6 to Vm 2 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 7 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 8 to Vm 0 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 9 to Vm 1 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 10 to Vm 2 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 11 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 12 to Vm 0 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 13 to Vm 1 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 14 to Vm 2 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 15 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 16 to Vm 0 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 17 to Vm 1 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 18 to Vm 2 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 19 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: All 20 waiting Cloudlets submitted to some VM.
INFO  7.95: DatacenterBrokerSimple2: Cloudlet 15 finished in Vm 3 and returned to broker.
INFO  8.33: DatacenterBrokerSimple2: Cloudlet 7 finished in Vm 3 and returned to broker.
INFO  8.84: DatacenterBrokerSimple2: Cloudlet 19 finished in Vm 3 and returned to broker.
INFO  10.43: DatacenterBrokerSimple2: Cloudlet 3 finished in Vm 3 and returned to broker.
INFO  12.01: DatacenterBrokerSimple2: Cloudlet 11 finished in Vm 3 and returned to broker.
INFO  15.86: DatacenterBrokerSimple2: Cloudlet 13 finished in Vm 1 and returned to broker.
INFO  17.81: DatacenterBrokerSimple2: Cloudlet 14 finished in Vm 2 and returned to broker.
INFO  19.55: DatacenterBrokerSimple2: Cloudlet 2 finished in Vm 2 and returned to broker.
INFO  22.11: DatacenterBrokerSimple2: Cloudlet 6 finished in Vm 2 and returned to broker.
INFO  22.54: DatacenterBrokerSimple2: Cloudlet 1 finished in Vm 1 and returned to broker.
INFO  23.60: DatacenterBrokerSimple2: Cloudlet 10 finished in Vm 2 and returned to broker.
INFO  24.96: DatacenterBrokerSimple2: Cloudlet 18 finished in Vm 2 and returned to broker.
INFO  25.85: DatacenterBrokerSimple2: Cloudlet 9 finished in Vm 1 and returned to broker.
INFO  28.96: DatacenterBrokerSimple2: Cloudlet 5 finished in Vm 1 and returned to broker.
INFO  30.41: DatacenterBrokerSimple2: Cloudlet 17 finished in Vm 1 and returned to broker.
INFO  50.32: DatacenterBrokerSimple2: Cloudlet 8 finished in Vm 0 and returned to broker.
INFO  51.74: DatacenterBrokerSimple2: Cloudlet 12 finished in Vm 0 and returned to broker.
INFO  62.72: DatacenterBrokerSimple2: Cloudlet 0 finished in Vm 0 and returned to broker.
INFO  63.33: DatacenterBrokerSimple2: Cloudlet 4 finished in Vm 0 and returned to broker.
INFO  66.00: DatacenterBrokerSimple2: Cloudlet 16 finished in Vm 0 and returned to broker.
INFO  66.11: Processing last events before simulation shutdown.
INFO  66.11: DatacenterBrokerSimple2 is shutting down...
INFO  66.11: DatacenterBrokerSimple2: Requesting Vm 3 destruction.
INFO  66.11: DatacenterBrokerSimple2: Requesting Vm 2 destruction.
INFO  66.11: DatacenterBrokerSimple2: Requesting Vm 1 destruction.
INFO  66.11: DatacenterBrokerSimple2: Requesting Vm 0 destruction.
INFO  66.11: DatacenterSimple: Vm 3 destroyed on Host 0/DC 1. 
INFO  66.11: DatacenterSimple: Vm 2 destroyed on Host 0/DC 1. 
INFO  66.11: DatacenterSimple: Vm 1 destroyed on Host 0/DC 1. 
INFO  66.11: DatacenterSimple: Vm 0 destroyed on Host 0/DC 1. 
INFO  Simulation: No more future events

INFO  CloudInformationService0: Notify all CloudSim Plus entities to shutdown.

INFO  
================== Simulation finished at time 66.11 ==================



                                               SIMULATION RESULTS

|Cloudlet| Status|DC|Host|Host PEs |VM|   VM PEs|CloudletLen|FinishedLen|CloudletPEs|StartTime|FinishTime|ExecTime
|--------|-------|--|----|---------|--|---------|-----------|-----------|-----------|---------|----------|--------
|      ID|       |ID|  ID|CPU cores|ID|CPU cores|         MI|         MI|  CPU cores|  Seconds|   Seconds| Seconds
|      15|SUCCESS| 1|   0|       16| 3|        2|       6234|       6234|          1|      0.1|       7.9|     7.8
|       7|SUCCESS| 1|   0|       16| 3|        2|       6606|       6606|          1|      0.1|       8.3|     8.2
|      19|SUCCESS| 1|   0|       16| 3|        2|       7189|       7189|          1|      0.1|       8.8|     8.7
|       3|SUCCESS| 1|   0|       16| 3|        2|      10313|      10313|          1|      0.1|      10.4|    10.3
|      11|SUCCESS| 1|   0|       16| 3|        2|      13473|      13473|          1|      0.1|      12.0|    11.9
|      13|SUCCESS| 1|   0|       16| 1|        2|       6263|       6263|          1|      0.1|      15.9|    15.8
|      14|SUCCESS| 1|   0|       16| 2|        2|      10562|      10562|          1|      0.1|      17.8|    17.7
|       2|SUCCESS| 1|   0|       16| 2|        2|      11847|      11847|          1|      0.1|      19.5|    19.4
|       6|SUCCESS| 1|   0|       16| 2|        2|      14434|      14434|          1|      0.1|      22.1|    22.0
|       1|SUCCESS| 1|   0|       16| 1|        2|       9588|       9588|          1|      0.1|      22.5|    22.4
|      10|SUCCESS| 1|   0|       16| 2|        2|      16569|      16569|          1|      0.1|      23.6|    23.5
|      18|SUCCESS| 1|   0|       16| 2|        2|      18596|      18596|          1|      0.1|      25.0|    24.9
|       9|SUCCESS| 1|   0|       16| 1|        2|      11748|      11748|          1|      0.1|      25.8|    25.7
|       5|SUCCESS| 1|   0|       16| 1|        2|      14904|      14904|          1|      0.1|      29.0|    28.9
|      17|SUCCESS| 1|   0|       16| 1|        2|      16262|      16262|          1|      0.1|      30.4|    30.3
|       8|SUCCESS| 1|   0|       16| 0|        2|       9978|       9978|          1|      0.1|      50.3|    50.2
|      12|SUCCESS| 1|   0|       16| 0|        2|      10317|      10317|          1|      0.1|      51.7|    51.6
|       0|SUCCESS| 1|   0|       16| 0|        2|      13985|      13985|          1|      0.1|      62.7|    62.6
|       4|SUCCESS| 1|   0|       16| 0|        2|      14254|      14254|          1|      0.1|      63.3|    63.2
|      16|SUCCESS| 1|   0|       16| 0|        2|      15592|      15592|          1|      0.1|      66.0|    65.9

=== Mode: BASELINE | Makespan simulasi: 66.00 detik ===
```

### Output dengan algoritma SA
```
================== Starting CloudSim Plus 8.0.0 ==================

INFO  0.00: DatacenterSimple1 is starting...
INFO  DatacenterBrokerSimple2 is starting...
INFO  Entities started.
INFO  0.00: DatacenterBrokerSimple2: List of 1 datacenters(s) received.
INFO  0.00: DatacenterBrokerSimple2: Trying to create Vm 0 in DatacenterSimple1
INFO  0.00: DatacenterBrokerSimple2: Trying to create Vm 1 in DatacenterSimple1
INFO  0.00: DatacenterBrokerSimple2: Trying to create Vm 2 in DatacenterSimple1
INFO  0.00: DatacenterBrokerSimple2: Trying to create Vm 3 in DatacenterSimple1
INFO  0.00: VmAllocationPolicySimple: Vm 0 has been allocated to Host 0/DC 1
INFO  0.00: VmAllocationPolicySimple: Vm 1 has been allocated to Host 0/DC 1
INFO  0.00: VmAllocationPolicySimple: Vm 2 has been allocated to Host 0/DC 1
INFO  0.00: VmAllocationPolicySimple: Vm 3 has been allocated to Host 0/DC 1
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 0 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 1 to Vm 2 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 2 to Vm 0 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 3 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 4 to Vm 1 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 5 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 6 to Vm 2 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 7 to Vm 1 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 8 to Vm 1 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 9 to Vm 0 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 10 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 11 to Vm 2 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 12 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 13 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 14 to Vm 1 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 15 to Vm 1 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 16 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 17 to Vm 2 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 18 to Vm 2 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: Sending Cloudlet 19 to Vm 3 in Host 0/DC 1.
INFO  0.10: DatacenterBrokerSimple2: All 20 waiting Cloudlets submitted to some VM.
INFO  12.74: DatacenterBrokerSimple2: Cloudlet 13 finished in Vm 3 and returned to broker.
INFO  14.37: DatacenterBrokerSimple2: Cloudlet 19 finished in Vm 3 and returned to broker.
INFO  15.82: DatacenterBrokerSimple2: Cloudlet 15 finished in Vm 1 and returned to broker.
INFO  16.19: DatacenterBrokerSimple2: Cloudlet 1 finished in Vm 2 and returned to broker.
INFO  16.57: DatacenterBrokerSimple2: Cloudlet 7 finished in Vm 1 and returned to broker.
INFO  19.07: DatacenterBrokerSimple2: Cloudlet 3 finished in Vm 3 and returned to broker.
INFO  19.07: DatacenterBrokerSimple2: Cloudlet 12 finished in Vm 3 and returned to broker.
INFO  21.43: DatacenterBrokerSimple2: Cloudlet 11 finished in Vm 2 and returned to broker.
INFO  21.65: DatacenterBrokerSimple2: Cloudlet 8 finished in Vm 1 and returned to broker.
INFO  22.27: DatacenterBrokerSimple2: Cloudlet 14 finished in Vm 1 and returned to broker.
INFO  22.38: DatacenterBrokerSimple2: Cloudlet 6 finished in Vm 2 and returned to broker.
INFO  22.78: DatacenterBrokerSimple2: Cloudlet 0 finished in Vm 3 and returned to broker.
INFO  23.50: DatacenterBrokerSimple2: Cloudlet 5 finished in Vm 3 and returned to broker.
INFO  23.61: DatacenterBrokerSimple2: Cloudlet 17 finished in Vm 2 and returned to broker.
INFO  23.72: DatacenterBrokerSimple2: Cloudlet 9 finished in Vm 0 and returned to broker.
INFO  23.83: DatacenterBrokerSimple2: Cloudlet 16 finished in Vm 3 and returned to broker.
INFO  23.94: DatacenterBrokerSimple2: Cloudlet 2 finished in Vm 0 and returned to broker.
INFO  24.32: DatacenterBrokerSimple2: Cloudlet 10 finished in Vm 3 and returned to broker.
INFO  25.20: DatacenterBrokerSimple2: Cloudlet 18 finished in Vm 2 and returned to broker.
INFO  25.96: DatacenterBrokerSimple2: Cloudlet 4 finished in Vm 1 and returned to broker.
INFO  26.07: Processing last events before simulation shutdown.
INFO  26.07: DatacenterBrokerSimple2 is shutting down...
INFO  26.07: DatacenterBrokerSimple2: Requesting Vm 3 destruction.
INFO  26.07: DatacenterBrokerSimple2: Requesting Vm 2 destruction.
INFO  26.07: DatacenterBrokerSimple2: Requesting Vm 1 destruction.
INFO  26.07: DatacenterBrokerSimple2: Requesting Vm 0 destruction.
INFO  26.07: DatacenterSimple: Vm 3 destroyed on Host 0/DC 1. 
INFO  26.07: DatacenterSimple: Vm 2 destroyed on Host 0/DC 1. 
INFO  26.07: DatacenterSimple: Vm 1 destroyed on Host 0/DC 1. 
INFO  26.07: DatacenterSimple: Vm 0 destroyed on Host 0/DC 1. 
INFO  Simulation: No more future events

INFO  CloudInformationService0: Notify all CloudSim Plus entities to shutdown.

INFO  
================== Simulation finished at time 26.07 ==================



                                               SIMULATION RESULTS

|Cloudlet| Status|DC|Host|Host PEs |VM|   VM PEs|CloudletLen|FinishedLen|CloudletPEs|StartTime|FinishTime|ExecTime
|--------|-------|--|----|---------|--|---------|-----------|-----------|-----------|---------|----------|--------
|      ID|       |ID|  ID|CPU cores|ID|CPU cores|         MI|         MI|  CPU cores|  Seconds|   Seconds| Seconds
|      13|SUCCESS| 1|   0|       16| 3|        2|       6263|       6263|          1|      0.1|      12.7|    12.6
|      19|SUCCESS| 1|   0|       16| 3|        2|       7189|       7189|          1|      0.1|      14.4|    14.3
|      15|SUCCESS| 1|   0|       16| 1|        2|       6234|       6234|          1|      0.1|      15.8|    15.7
|       1|SUCCESS| 1|   0|       16| 2|        2|       9588|       9588|          1|      0.1|      16.2|    16.1
|       7|SUCCESS| 1|   0|       16| 1|        2|       6606|       6606|          1|      0.1|      16.6|    16.5
|       3|SUCCESS| 1|   0|       16| 3|        2|      10313|      10313|          1|      0.1|      19.1|    19.0
|      12|SUCCESS| 1|   0|       16| 3|        2|      10317|      10317|          1|      0.1|      19.1|    19.0
|      11|SUCCESS| 1|   0|       16| 2|        2|      13473|      13473|          1|      0.1|      21.4|    21.3
|       8|SUCCESS| 1|   0|       16| 1|        2|       9978|       9978|          1|      0.1|      21.7|    21.5
|      14|SUCCESS| 1|   0|       16| 1|        2|      10562|      10562|          1|      0.1|      22.3|    22.2
|       6|SUCCESS| 1|   0|       16| 2|        2|      14434|      14434|          1|      0.1|      22.4|    22.3
|       0|SUCCESS| 1|   0|       16| 3|        2|      13985|      13985|          1|      0.1|      22.8|    22.7
|       5|SUCCESS| 1|   0|       16| 3|        2|      14904|      14904|          1|      0.1|      23.5|    23.4
|      17|SUCCESS| 1|   0|       16| 2|        2|      16262|      16262|          1|      0.1|      23.6|    23.5
|       9|SUCCESS| 1|   0|       16| 0|        2|      11748|      11748|          1|      0.1|      23.7|    23.6
|      16|SUCCESS| 1|   0|       16| 3|        2|      15592|      15592|          1|      0.1|      23.8|    23.7
|       2|SUCCESS| 1|   0|       16| 0|        2|      11847|      11847|          1|      0.1|      23.9|    23.8
|      10|SUCCESS| 1|   0|       16| 3|        2|      16569|      16569|          1|      0.1|      24.3|    24.2
|      18|SUCCESS| 1|   0|       16| 2|        2|      18596|      18596|          1|      0.1|      25.2|    25.1
|       4|SUCCESS| 1|   0|       16| 1|        2|      14254|      14254|          1|      0.1|      26.0|    25.9

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
