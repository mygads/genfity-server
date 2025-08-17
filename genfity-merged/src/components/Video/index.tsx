"use client";

import SectionTitle from "../Common/SectionTitle";
import { HeroVideoDialog } from "../ui/hero-video-dialog";

const Video = () => {
  return (
    <section className="relative z-10 py-16 md:py-20 lg:py-28">
      <div className="container">
        <SectionTitle
          title="We are ready to help"
          paragraph="There are many variations of passages of Lorem Ipsum available but the majority have suffered alteration in some form."
          center
          mb="80px"
        />

        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="mx-auto max-w-[770px] overflow-hidden rounded-md">
              <div className="relative aspect-[77/40] items-center justify-center">
                <div className="relative">
                  <HeroVideoDialog
                    className="block"
                    animationStyle="from-center"
                    videoSrc="https://www.youtube.com/embed/Z-WVUlWRxzc?si=1CPcj9q-LTN7vNdk"
                    thumbnailSrc="/images/video/video.png"
                    thumbnailAlt="Hero Video"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Video;
