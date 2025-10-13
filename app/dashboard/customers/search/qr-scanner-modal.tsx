"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, QrCode } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}

// Basit modal + QR tarayıcı
export default function QrScannerModal({ open, onClose, onResult }: QrScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {}
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (!open) return;
      try {
        const elementId = "qr-reader-viewport";
        if (!document.getElementById(elementId)) return;
        const instance = new Html5Qrcode(elementId);
        scannerRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!isMounted) return;
            onResult(decodedText);
          },
          () => {}
        );
      } catch (e: any) {
        setError(e?.message || "Kamera başlatılamadı");
      }
    }
    init();
    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [open, onResult, stopScanner]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <span className="font-medium">QR Kod Okut</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {error && (
            <div className="text-sm text-red-600 mb-3">{error}</div>
          )}
          <div id="qr-reader-viewport" className="w-full aspect-square bg-black rounded-md overflow-hidden" />
          <div className="text-xs text-gray-500 mt-2">
            Kamerayı QR koda doğru yaklaştırın. Kod okununca otomatik işlem yapılır.
          </div>
        </div>
      </div>
    </div>
  );
}


