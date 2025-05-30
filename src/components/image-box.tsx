'use client'
import { forwardRef, useEffect, useState } from "react";
import Skeleton from "./skeleton";
import '@/css/img-box.css';
import { useDataFromApi } from "@/store/data.store";
type TImageBoxProps = {
  src: string
  isNetwork: boolean
  ratio: string
  priority: 'width' | 'height'
  center: boolean
  backgroundColor?: string
}

const ImageBox = forwardRef<any, TImageBoxProps>(({ src,
  isNetwork,
  ratio,
  priority,
  center,
  backgroundColor
}, __) => {
  const imgPath = optimizeSrc()
  const [loading, setLoading] = useState<boolean>(isNetwork)
  const [isError, setIsError] = useState<boolean>(false)
  const { getImage, addImage } = useDataFromApi()
  function optimizeSrc() {
    if (src.trim().length < 1) return src;
    const chops = src.split('.');
    if (chops[chops.length - 1].toLowerCase() != 'png') return `${src}.png`;
    return src;
  }
  async function loadImage() {
    const chunks = imgPath.split('.');
    const subChunks = chunks[0].split('/');
    const name = subChunks[subChunks.length - 1];
    if (!name) return;
    const img = getImage(name);
    if (!!img) {
      if (!img.img) {
        setIsError(() => true);
      }
      setLoading(() => false);
      return;
    }
    const image = new Image();
    image.src = imgPath;
    image.onload = () => {
      addImage({
        name,
        ext: 'png',
        img: image
      });
      setLoading(() => false);
    }
    image.onerror = () => {
      addImage({ name })
      setIsError(() => true)
      setLoading(() => false)
    }
    setLoading(() => false);

  }
  useEffect(() => {
    if (!isNetwork) return;
    loadImage();
  }, [])
  return (
    <div className="img-box" style={{ aspectRatio: ratio, backgroundColor: backgroundColor ?? undefined }}>
      {loading ? <Skeleton /> :
        isError ?
          <div className="img-box-placeholder">
            <i className="ri-image-fill"></i>
          </div> :
          <div className={`img-box-view ${priority}${center ? ' center' : ''}`}>
            <img src={imgPath} alt="" />
          </div>
      }
    </div>
  )
})
export default ImageBox;