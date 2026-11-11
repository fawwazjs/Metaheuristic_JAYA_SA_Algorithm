# Sumber dataset

## GoCJ: Google Cloud Jobs Dataset

- Paper: Hussain, A., & Aleem, M. (2018). GoCJ: Google cloud jobs dataset for distributed and cloud computing infrastructures. *Data, 3*(4), 38. https://doi.org/10.3390/data3040038
- Data: Mendeley Data, DOI [10.17632/b7bp6xhrcd.1](https://doi.org/10.17632/b7bp6xhrcd.1), lisensi CC BY 4.0.
- Isi: satu ukuran job (MI) per baris, urutan sesuai publikasi.
- Pengambilan: unduhan langsung dari Mendeley ditolak (HTTP 403), jadi file disalin dari repo `baksoogoreng/soka-taskscheduling1`. Setiap file lalu dicocokkan dengan hash SHA-256 yang dipublikasikan API Mendeley, dan semuanya cocok.

| File | SHA-256 |
| --- | --- |
| `gocj/GoCJ_Dataset_100.txt` | `56f388ec57097229b86dee2dc70784f1fc1a8d7376aa98e5fc3efb3ca7a53a3e` |
| `gocj/GoCJ_Dataset_200.txt` | `b010ae9738eefede885c676b60562422258a904d745be5666571af39c1d3d955` |
| `gocj/GoCJ_Dataset_300.txt` | `f86f79d9264f1eb4064f77d23a164dbfe4dfa6330d0c354714f3b4c2eda48eb9` |
| `gocj/GoCJ_Dataset_400.txt` | `6589d62b19ca36216d641486703826582bfeff99728726f80ebbc14eaf1fb741` |
| `gocj/GoCJ_Dataset_500.txt` | `c2792fce2695fa822ed73976dec88c3d1b7a97d24d9440d1063ac04428299617` |
| `gocj/GoCJ_Dataset_600.txt` | `6369fd20e97bcdb99d101fd96dfa1a509a952ee4044cbb42e5af70a04e4ca45e` |
| `gocj/GoCJ_Dataset_700.txt` | `8a12bd3f5d7618018c844e9cac436a012b6bf0eaeb8b19946fba93440e309c6e` |
| `gocj/GoCJ_Dataset_750.txt` | `88ddca1c3cf4d317ade07167f2dc9e60d7feea6b24e606ed50f65a7f1a6c1ce5` |
| `gocj/GoCJ_Dataset_800.txt` | `2bf8dad3d87523e710998e270c59044bafe97c46d378eedd3eed865ddb68386e` |
| `gocj/GoCJ_Dataset_900.txt` | `4525a5589a326006aba758218aebd336813bc535caf2880f789735e0d3e038d3` |
| `gocj/GoCJ_Dataset_1000.txt` | `a4a3fa564c4407a950360650103883434de88234fc51de39ac46e85ebbd98628` |

## NASA Ames iPSC/860 1993 (cleaned)

- Paper: Feitelson, D. G., & Nitzberg, B. (1995). Job characteristics of a production parallel scientific workload on the NASA Ames iPSC/860. Dalam *Job Scheduling Strategies for Parallel Processing* (hlm. 337–360). Springer. https://doi.org/10.1007/3-540-60153-8_38
- Data: Parallel Workloads Archive, `NASA-iPSC-1993-3.1-cln.swf` (18.239 job).
- Pengambilan: situs arsip memblokir unduhan otomatis, jadi file diambil dari repo `cloudsimplus/cloudsimplus` (`src/test/resources/NASA-iPSC-1993-3.1-cln.swf.zip`). Hash blob git-nya cocok dengan versi di repo tersebut.

| File | SHA-256 |
| --- | --- |
| `nasa/NASA-iPSC-1993-3.1-cln.swf.zip` | `4d25e58c84bbf2b34b4cdf07d6b0bc70cea52e47d7e93397a6eb4b2a65ad9fbc` |
