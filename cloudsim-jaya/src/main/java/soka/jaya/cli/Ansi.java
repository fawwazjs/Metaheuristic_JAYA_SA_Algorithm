package soka.jaya.cli;

/** Potongan tampilan terminal tanpa library: sparkline, bar, kolom beban VM, warna, dan pemotongan baris. */
final class Ansi {
    static final String HIDE_CURSOR = "\u001b[?25l";
    static final String SHOW_CURSOR = "\u001b[?25h";
    static final String CLEAR_DOWN = "\u001b[J";
    static final String RESET = "\u001b[0m";
    static final String BOLD = "\u001b[1m";
    static final String DIM = "\u001b[2m";
    static final String RED = "\u001b[31m";
    static final String GREEN = "\u001b[32m";
    static final String YELLOW = "\u001b[33m";
    static final String BLUE = "\u001b[34m";
    static final String MAGENTA = "\u001b[35m";

    private static final String LEVELS = "▁▂▃▄▅▆▇█";

    private Ansi() {
    }

    /** Memindahkan kursor ke awal baris {@code lines} baris di atasnya. */
    static String up(int lines) {
        return "\u001b[" + lines + "F";
    }

    /**
     * Kurva mini: nilai dibagi ke paling banyak {@code width} kelompok (diambil nilai di ujung
     * kelompok), lalu dipetakan ke 8 tinggi balok antara minimum dan maksimum.
     */
    static String sparkline(double[] values, int width) {
        int buckets = Math.min(width, values.length);
        if (buckets == 0) {
            return "";
        }
        double[] sampled = new double[buckets];
        double min = Double.POSITIVE_INFINITY;
        double max = Double.NEGATIVE_INFINITY;
        for (int b = 0; b < buckets; b++) {
            sampled[b] = values[(int) ((long) (b + 1) * values.length / buckets) - 1];
            min = Math.min(min, sampled[b]);
            max = Math.max(max, sampled[b]);
        }
        StringBuilder line = new StringBuilder(buckets);
        for (double value : sampled) {
            int level = max > min ? (int) Math.round((value - min) / (max - min) * (LEVELS.length() - 1)) : 3;
            line.append(LEVELS.charAt(level));
        }
        return line.toString();
    }

    static String bar(double fraction, int width) {
        int filled = (int) Math.round(Math.max(0, Math.min(1, fraction)) * width);
        return "█".repeat(filled) + "░".repeat(width - filled);
    }

    /** Satu karakter per VM: tinggi = waktu selesai VM dibanding {@code max}; VM menganggur = titik. */
    static String columns(double[] values, double max) {
        StringBuilder line = new StringBuilder(values.length);
        for (double value : values) {
            if (value <= 0 || max <= 0) {
                line.append('·');
            } else {
                int level = (int) Math.ceil(value / max * LEVELS.length()) - 1;
                line.append(LEVELS.charAt(Math.max(0, Math.min(LEVELS.length() - 1, level))));
            }
        }
        return line.toString();
    }

    static String color(String text, String code, boolean enabled) {
        return enabled ? code + text + RESET : text;
    }

    /** Panjang yang terlihat di layar: kode escape tidak dihitung. */
    static int visibleLength(String text) {
        int length = 0;
        for (int i = 0; i < text.length(); i++) {
            int end = escapeEnd(text, i);
            if (end > i) {
                i = end;
            } else {
                length++;
            }
        }
        return length;
    }

    /**
     * Memotong baris agar tidak lebih dari {@code width − 1} karakter terlihat, supaya tidak
     * terlipat (lipatan merusak hitungan baris saat blok live digambar ulang).
     */
    static String fit(String line, int width) {
        int limit = Math.max(10, width - 1);
        if (visibleLength(line) <= limit) {
            return line;
        }
        StringBuilder out = new StringBuilder();
        int visible = 0;
        for (int i = 0; i < line.length(); i++) {
            int end = escapeEnd(line, i);
            if (end > i) {
                out.append(line, i, end + 1);
                i = end;
            } else if (visible < limit - 1) {
                out.append(line.charAt(i));
                visible++;
            } else {
                break;
            }
        }
        return out.append('…').append(RESET).toString();
    }

    /** Indeks huruf penutup kode escape CSI yang dimulai di {@code i}, atau {@code i} bila bukan escape. */
    private static int escapeEnd(String text, int i) {
        if (text.charAt(i) != '\u001b' || i + 1 >= text.length() || text.charAt(i + 1) != '[') {
            return i;
        }
        for (int j = i + 2; j < text.length(); j++) {
            char c = text.charAt(j);
            if (c >= '@' && c <= '~') {
                return j;
            }
        }
        return text.length() - 1;
    }
}
