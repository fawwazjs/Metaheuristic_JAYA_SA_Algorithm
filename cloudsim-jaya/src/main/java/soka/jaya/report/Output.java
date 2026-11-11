package soka.jaya.report;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/** Menulis file hasil, membuat folder induknya bila belum ada. */
final class Output {
    private Output() {
    }

    static void write(Path file, String content) {
        try {
            Files.createDirectories(file.toAbsolutePath().getParent());
            Files.writeString(file, content);
        } catch (IOException e) {
            throw new UncheckedIOException("Gagal menulis " + file, e);
        }
    }

    static void writeLines(Path file, List<String> lines) {
        write(file, String.join("\n", lines) + "\n");
    }
}
