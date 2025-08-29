---
title: Boot a Linux Kernel Without GRUB (GenesisOS Tutorial)
description: Step‑by‑step guide to booting a kernel and initramfs directly with systemd‑boot + EFI stub, plus QEMU tips. Buildroot optional.
published: 2025-08-15
tag: devlog
featured: true
image: /images/gen.png
---

Most Linux guides assume you need **GRUB** as a bootloader. You don’t. If your kernel is built with the **EFI stub**, you can boot it directly with **systemd‑boot**.  

This tutorial shows how to set up a **GRUB‑less boot** for your own OS: place a kernel + initramfs on an EFI System Partition (ESP), add a systemd‑boot entry, and run it in QEMU. For **GenesisOS**, I *generated* the kernel and initramfs with **Buildroot**, but any toolchain works (distro kernel, Yocto, hand‑rolled, etc.).

---
&ensp;
## 1) What you need

- **A Linux kernel** compiled with `CONFIG_EFI_STUB=y` (and your usual options).
- **An initramfs** (cpio archive, often compressed like `.gz`/`.xz`).
- **An EFI System Partition (ESP)** (FAT32).
- **systemd‑boot** (tiny EFI boot manager).
- **OVMF** (UEFI firmware) and **QEMU** (for testing).

> If you use Buildroot (like GenesisOS): you’ll get `bzImage` and `rootfs.cpio.gz` in `output/images/`.

---
&ensp;
## 2) Create/prepare an ESP

Make a small FAT32 partition (e.g., 128–256MB) and mount it somewhere (e.g., `/mnt/esp`). Your final ESP must have this structure:

```
/EFI/BOOT/BOOTX64.EFI          # systemd-boot binary
/loader/loader.conf            # global config
/loader/entries/your-os.conf   # boot entry
/bzImage                       # kernel (any filename is okay)
/rootfs.cpio.gz                # initramfs (any filename is okay)
```

Install **systemd‑boot** into the ESP (from a Linux host with systemd):

```bash
sudo bootctl --path=/mnt/esp install
```

Create the **loader config**:

```ini
# /mnt/esp/loader/loader.conf
default your-os
timeout 3
console-mode max
```

Create the **boot entry**:

```ini
# /mnt/esp/loader/entries/your-os.conf
title   Your OS
linux   /bzImage
initrd  /rootfs.cpio.gz
options root=/dev/vda2 rw quiet
```

> The `linux` and `initrd` paths are **relative to the ESP root**. Name them however you like; just keep the entry consistent.

---
&ensp;
## 3) Compile the kernel with EFI stub

Ensure the kernel has:

- `CONFIG_EFI=y`
- `CONFIG_EFI_STUB=y`
- Your usual drivers (storage, framebuffer/GPU, etc.)

If you’re using Buildroot (GenesisOS does): set kernel + cpio rootfs in your defconfig. After `make`, you’ll have **`bzImage`** and **`rootfs.cpio.gz`** ready to copy to the ESP.

---
&ensp;
## 4) (Optional) Automate ESP staging during your build
Rather than copying by hand, you can generate the ESP layout during your build. Here’s a post‑build script that assumes Buildroot variables; adapt paths if you’re not using Buildroot:

```sh
#!/bin/sh
# post-build.sh
set -e
ESP_DIR="$TARGET_DIR/boot/efi"

mkdir -p "$ESP_DIR/EFI/BOOT" "$ESP_DIR/loader/entries"

# Copy artifacts (adjust if you don't use Buildroot)
cp "$BINARIES_DIR/bzImage"        "$ESP_DIR/bzImage"
cp "$BINARIES_DIR/rootfs.cpio.gz" "$ESP_DIR/rootfs.cpio.gz"

# Install systemd-boot if available on the build host/runtime
if command -v bootctl >/dev/null 2>&1; then
  bootctl --path="$ESP_DIR" install
fi

# Configs
cat > "$ESP_DIR/loader/loader.conf" <<EOF
default your-os
timeout 3
console-mode max
EOF

cat > "$ESP_DIR/loader/entries/your-os.conf" <<'EOF'
title   Your OS
linux   /bzImage
initrd  /rootfs.cpio.gz
options root=/dev/vda2 rw quiet
EOF
```

Hook it up (Buildroot example):

```make
# external/external.mk
BR2_ROOTFS_POST_BUILD_SCRIPT += $(BR2_EXTERNAL_MYOS_PATH)/post-build.sh
```

If later build steps overwrite files, add a **post‑image** hook and re‑apply changes after images are finalized.

---
&ensp;
## 5) Boot in QEMU (UEFI)

Use OVMF for UEFI and pass a disk image that contains your ESP + rootfs partitions (or an ESP‑only image for early testing):

```bash
qemu-system-x86_64   
    -machine q35,accel=kvm   
    -m 2G   
    -cpu host   
    -bios /usr/share/OVMF/OVMF_CODE.fd   
    -drive file=disk.img,if=virtio,format=raw   
    -device virtio-vga-gl   
    -display sdl,gl=on   
    -serial mon:stdio
```

Notes:

- `OVMF_CODE.fd` supplies UEFI firmware so systemd‑boot can run.
- `virtio-vga-gl` + `-display sdl,gl=on` enables KMS/modesetting in the guest.
- If `virtio-vga-gl` isn’t available, try:
  ```bash
  -device virtio-gpu-pci,virgl=on
  -display gtk,gl=on
  ```

You should see systemd‑boot → your entry → kernel runs with the initramfs.

---
&ensp;
## 6) Troubleshooting

**Black screen / stuck at VGA**  
• Ensure you used a **virtio** GPU device and enabled GL.  
• Verify kernel has DRM/KMS drivers (e.g., `CONFIG_DRM_VIRTIO_GPU`).

**systemd‑boot doesn’t list my entry**  
• Check ESP paths and case sensitivity.  
• Ensure `/loader/entries/*.conf` exists and has `title` + `linux` lines.

**Kernel not launching (‘Unsupported’)**  
• Your kernel likely lacks `CONFIG_EFI_STUB=y`. Rebuild with EFI stub.

**Modules not found after boot**  
• Run `depmod` at the right stage (post‑image), or embed needed drivers in the kernel until your userspace is ready to run depmod.

**Wrong `initrd` path**  
• Paths are relative to ESP root. If you nest files, update the entry accordingly.

---
&ensp;
## 7) Why skip GRUB?

- **Simplicity**: UEFI → systemd‑boot → EFI‑stub kernel.  
- **Reproducibility**: All artifacts generated by your build; fewer moving parts.  
- **Speed**: Minimal bootloader logic; straight into your kernel.

---
&ensp;
## 8) Summary checklist

- [ ] Kernel compiled with `CONFIG_EFI_STUB=y`  
- [ ] Initramfs built (cpio, compressed ok)  
- [ ] FAT32 ESP with systemd‑boot installed (`bootctl --path=... install`)  
- [ ] `/loader/loader.conf` + `/loader/entries/*.conf` created  
- [ ] `linux=/path/to/kernel` and `initrd=/path/to/initramfs` correct  
- [ ] QEMU launched with OVMF and a modern GPU device

---
&ensp;
### GenesisOS notes (what I used)
- Artifacts produced by **Buildroot**: `bzImage`, `rootfs.cpio.gz`.  
- ESP staged automatically via a **post‑build hook**.  
- QEMU GPU: `virtio-vga-gl` for modesetting + VirGL.  
- No GRUB anywhere in the boot path.

Happy booting — and welcome to the GRUB‑less club.
