package soka.jaya.cli;

/**
 * Kemampuan terminal tempat CLI berjalan.
 *
 * @param interactive stdin dan stdout terhubung ke terminal (bisa bertanya ke pengguna)
 * @param ansi        boleh menggambar ulang blok live dengan kode escape
 * @param color       boleh memakai warna (dimatikan oleh NO_COLOR)
 * @param columns     lebar terminal
 */
public record Term(boolean interactive, boolean ansi, boolean color, int columns) {
    public static final Term PLAIN = new Term(false, false, false, 80);

    /**
     * Skrip {@code ./sim} mengirim {@code -Dsim.tty} ({@code [[ -t 0 && -t 1 ]]}) dan
     * {@code -Dsim.columns}; tanpa skrip, {@link System#console()} dipakai sebagai cadangan.
     */
    public static Term detect() {
        String tty = System.getProperty("sim.tty");
        boolean interactive = tty != null ? tty.equals("1") : System.console() != null;
        String term = System.getenv("TERM");
        boolean ansi = interactive && term != null && !term.isBlank() && !term.equals("dumb");
        boolean color = ansi && System.getenv("NO_COLOR") == null;
        return new Term(interactive, ansi, color, columns(System.getProperty("sim.columns"), System.getenv("COLUMNS")));
    }

    /** Tetap bisa bertanya, tetapi keluaran berupa baris teks biasa ({@code --plain}). */
    public Term plain() {
        return new Term(interactive, false, false, columns);
    }

    private static int columns(String... candidates) {
        for (String candidate : candidates) {
            try {
                int value = Integer.parseInt(candidate == null ? "" : candidate.trim());
                if (value >= 20) {
                    return value;
                }
            } catch (NumberFormatException ignored) {
                // coba sumber berikutnya
            }
        }
        return 80;
    }
}
