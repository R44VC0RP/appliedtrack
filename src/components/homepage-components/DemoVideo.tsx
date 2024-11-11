import ReactPlayer from 'react-player'

export default function DemoVideo() {
  return (
    <div className="relative mx-auto max-w-[1200px]">
      <div className="relative rounded-lg overflow-hidden border shadow-lg dark:border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        <ReactPlayer
          url="https://utfs.io/f/HhaWmBOvDmlROQ3xTvtchYsK8zZDAp4J1TSadIxoHBWQ7lPq"
          width="100%"
          height="100%"
          playing={true}
          loop={true}
          muted={true}
          controls={false}
          playsinline={true}
          config={{
            file: {
              attributes: {
                style: { width: '100%', height: '100%' }
              }
            }
          }}
        />
      </div>
    </div>
  )
} 