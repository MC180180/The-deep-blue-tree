/* Deep Blue Tree - numeric kernels for wasm32.
 * Memory layout (doubles):
 *   A: [0, 8 MiB)
 *   B: [8 MiB, 16 MiB)
 *   O: [16 MiB, 24 MiB)
 * JS is responsible for growing memory when a slice does not fit.
 */

#define A_BASE 0
#define B_BASE (8u * 1024u * 1024u)
#define O_BASE (16u * 1024u * 1024u)
#define SLOT_BYTES (8u * 1024u * 1024u)
#define SLOT_DOUBLES (SLOT_BYTES / 8u)

#define A_PTR ((double *)(unsigned long)A_BASE)
#define B_PTR ((double *)(unsigned long)B_BASE)
#define O_PTR ((double *)(unsigned long)O_BASE)

__attribute__((visibility("default")))
int matmul_f64(int ar, int ac, int br, int bc) {
    if (ar <= 0 || ac <= 0 || br <= 0 || bc <= 0 || ac != br) return -1;
    if ((unsigned long)ar * ac > SLOT_DOUBLES) return -2;
    if ((unsigned long)br * bc > SLOT_DOUBLES) return -2;
    if ((unsigned long)ar * bc > SLOT_DOUBLES) return -2;

    double *a = A_PTR;
    double *b = B_PTR;
    double *o = O_PTR;

    for (int i = 0; i < ar; i++) {
        double *orow = o + (unsigned long)i * bc;
        for (int k = 0; k < ac; k++) {
            double av = a[(unsigned long)i * ac + k];
            if (av == 0.0) continue;
            const double *brow = b + (unsigned long)k * bc;
            for (int j = 0; j < bc; j++) {
                orow[j] += av * brow[j];
            }
        }
    }
    return 0;
}

__attribute__((visibility("default")))
int elementwise_f64(int n, int op) {
    if (n <= 0 || (unsigned long)n > SLOT_DOUBLES) return -1;

    double *a = A_PTR;
    double *b = B_PTR;
    double *o = O_PTR;

    for (int i = 0; i < n; i++) {
        double av = a[i];
        double bv = b[i];
        if (op == 0) o[i] = av + bv;
        else if (op == 1) o[i] = av - bv;
        else if (op == 2) o[i] = av * bv;
        else if (op == 3) o[i] = bv == 0.0 ? 0.0 : av / bv;
        else return -2;
    }
    return 0;
}

__attribute__((visibility("default")))
double dot_f64(int n) {
    if (n <= 0 || (unsigned long)n > SLOT_DOUBLES) return 0.0;
    double *a = A_PTR;
    double *b = B_PTR;
    double sum = 0.0;
    for (int i = 0; i < n; i++) sum += a[i] * b[i];
    return sum;
}
