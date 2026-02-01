import VideoTile from './VideoTile';
import { useAppContext } from '../context/AppContext';

const VideoGrid = ({ participants }) => {
  const { isHost, removeParticipant } = useAppContext();
  const count = participants.length;

  // Determine grid layout based on participant count
  const getGridClass = () => {
    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-2';
      case 5:
      case 6:
        return 'grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  // Determine video tile size based on count
  const getTileSize = () => {
    if (count === 1) return 'large';
    if (count <= 4) return 'normal';
    return 'small';
  };

  if (count === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-meet-gray/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-meet-light-gray">No participants in call</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className={`grid ${getGridClass()} gap-4 h-full auto-rows-fr`}>
        {participants.map((participant) => (
          <VideoTile
            key={participant.id}
            participant={participant}
            isLocal={participant.isLocal}
            size={getTileSize()}
            isHost={isHost}
            onRemove={removeParticipant}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
