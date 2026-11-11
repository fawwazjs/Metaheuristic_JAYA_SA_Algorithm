package soka.jaya;

/** Hasil evaluasi satu pemetaan: waktu mulai/selesai tiap cloudlet dan ringkasan per VM. */
public record Schedule(double[] start, double[] finish, double[] vmFinish, double[] vmBusy, double makespan) {
}
