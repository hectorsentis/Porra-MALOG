"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export default function Loading() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-air-page text-slate-500">
      <motion.div
        aria-hidden
        className="relative h-28 w-28 sm:h-32 sm:w-32"
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={{
          duration: 2.1,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
        }}
      >
        <Image
          src="/assets/loading.png"
          alt=""
          fill
          priority
          sizes="(min-width: 640px) 128px, 112px"
          className="object-contain"
        />
      </motion.div>
      <p className="font-display text-sm uppercase tracking-[0.3em]" role="status">
        Cargando
        <span className="sr-only"> contenido</span>
      </p>
    </div>
  );
}
