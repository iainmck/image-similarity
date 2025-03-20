import { useState } from "react";
import { Badge, Tooltip } from "@radix-ui/themes";
import Image from "next/image";

const NO_IMAGE_URL = "https://ps.w.org/replace-broken-images/assets/icon-256x256.png?rev=2561727";

export function EvaluationImage(props: { 
  imageUrl: string | undefined, 
  filename: string, 
  warning?: boolean, 
  warningText?: string,
  percent?: number, 
  highThreshold?: number,
  lowThreshold?: number,
}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const imageElement = (
    <Image 
      src={props.imageUrl ?? NO_IMAGE_URL} 
      alt={props.filename} 
      width={75}
      height={75}
      className='max-w-[75px] max-h-[75px] object-cover object-center cursor-pointer' 
      onClick={() => setIsPopupOpen(true)}
    />
  );

  return (
    <div 
      className={`w-[75px] h-[75px] flex relative`}
    >
      {props.warning && props.warningText ? (
        <Tooltip content={props.warningText}>
          {imageElement}
        </Tooltip>
      ) : (
        imageElement
      )}

      {props.percent && props.highThreshold && props.lowThreshold && (
        <Badge 
          size="1" 
          color={props.percent >= props.highThreshold ? 'jade' : props.percent >= props.lowThreshold ? 'bronze' : 'gray'} 
          variant="solid" 
          className="absolute top-0 left-0 scale-75 opacity-90"
        >
          {`${Math.round(props.percent * 100)}%`}
        </Badge>
      )}

      {props.warning && (
        <div className="absolute top-0 left-0 w-full h-full border-2 border-red-500 pointer-events-none" />
      )}

      {isPopupOpen && props.imageUrl && (
        <ImagePopupView 
          imageUrl={props.imageUrl} 
          filename={props.filename} 
          onClose={() => setIsPopupOpen(false)}
        />
      )}
    </div>
  )
}

function ImagePopupView(props: { imageUrl: string, filename: string, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col justify-center items-center z-50" onClick={(e) => {
      e.stopPropagation();
      props.onClose();
    }}>
      <Image src={props.imageUrl} alt={props.filename} width={250} height={250} />
      <Badge size="2" color="gray" variant="solid" mt="2">
        {props.filename}
      </Badge>
    </div>
  )
}
