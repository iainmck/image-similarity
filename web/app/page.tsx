"use client";

import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Loader, Plus } from "lucide-react";
import { useState } from "react";

import { optimizeImage } from "@/utils/image";
import { PercentBadge } from "@/components/PercentBadge";

export default function DropzonePage() {
  const [status, setStatus] = useState<"ready" | "uploading" | "searching" | "done" | "error">("ready");
  const [preview, setPreview] = useState<string | null>(null); // base64 image
  const [results, setResults] = useState<any[]>([]);

  const handleDrop = async (acceptedFiles: File[]) => {
    setResults([]);
    setPreview(null);

    const uploadedFile = acceptedFiles[0];
    // No valid file provided; Show a temporary message
    if (!uploadedFile) {
      alert("Unsupported file type");
      return;
    }

    setStatus("uploading");
    
    // Resize and minimize the image
    const base64image = await optimizeImage(uploadedFile, true);

    if (!base64image) {
      alert("Failed to compress image");
      setStatus("error");
      return;
    }
    
    setPreview(base64image);

    try {
      // Send image to the server
      setStatus("searching");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/main/find-similar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64image }),
        }
      );

      console.log(response);

      if (!response.ok) {
        alert("Upload issue");
        setStatus("error");
        throw new Error("Failed to upload image: " + response.statusText);
      }

      const data = await response.json();
      setResults(data.matches);
      setStatus("done");
    } catch (error) {
      setStatus("error");
      console.error(error);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col justify-center items-center w-full h-full p-8">

      <p className="text-sm text-gray-500 mb-2 -mt-4 font-[family-name:var(--font-geist-mono)]">{status}</p>

      <Dropzone onDrop={handleDrop} isGenerating={status === "uploading" || status === "searching"} preview={preview} />

      <div className="absolute bottom-0 flex flex-row gap-1 justify-center items-center">
        {results.slice(0, window.innerWidth < 768 ? 3 : 5).map((result) =>
          <div key={result.filename} className="relative">
            <Image 
              src={result.image_url} 
              alt={result.filename} 
              width={100} height={100} 
              className="rounded-md max-w-[70px] md:max-w-[100px] h-[100px] object-cover object-center"
            />
            <PercentBadge 
              percent={result.similarity} 
              highThreshold={0.9} 
              lowThreshold={0.8} 
              className="absolute top-1 left-1 opacity-70 md:opacity-90"
            />
          </div>
        )}
      </div>
    </div>
  );
}


function Dropzone(props: {
  onDrop: (acceptedFiles: File[]) => void;
  isGenerating: boolean;
  preview: string | null;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: props.onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    multiple: false,
    disabled: props.isGenerating,
  });

  return (
    <div
    {...getRootProps()}
    style={{ width: '400px', height: '400px', maxWidth: '100%' }}
    className={`
      relative overflow-hidden
      flex flex-col items-center justify-center
      border border-green-600 rounded-2xl ring-4 ring-green-600/30
      bg-green-500/10
      cursor-pointer
      transition-all duration-300
      ${props.isGenerating && "cursor-progress"}
      ${props.preview && "bg-green-500/15"}
      ${isDragActive && "bg-green-500/20 transform scale-[102%]"}
    `}
  >
    <Plus strokeWidth={1} className="w-6 h-6 text-green-500" />

    <input {...getInputProps()} />

    {props.preview && (
      <div className="absolute inset-0">
        <Image
          src={props.preview}
          alt="Preview"
          fill
          className="object-cover"
          sizes="(max-width: 240px) 100vw, 240px"
        />
      </div>
    )}

    {props.isGenerating && (
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
        <div className="flex items-center justify-center w-8 h-8 min-w-8 min-h-8 max-w-8 max-h-8">
          <Loader
            strokeWidth={1}
            className="w-6 h-6 min-w-6 min-h-6 max-w-6 max-h-6 tracking-none leading-none text-white animate-spin"
          />
        </div>
      </div>
    )}
  </div>
  );
}
