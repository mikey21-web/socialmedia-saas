import {
  ThirdParty,
  ThirdPartyAbstract,
} from '../thirdparty.interface';

const timer = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@ThirdParty({
  identifier: 'heygen',
  title: 'HeyGen',
  description: 'HeyGen is a platform for creating AI-generated avatar videos.',
  position: 'media',
  fields: [],
})
export class HeygenProvider extends ThirdPartyAbstract<{
  voice: string;
  avatar: string;
  aspect_ratio: string;
  captions: string;
}> {
  async checkConnection(
    apiKey: string,
  ): Promise<false | { name: string; username: string; id: string }> {
    const res = await fetch('https://api.heygen.com/v1/user/me', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!res.ok) {
      return false;
    }

    const { data } = await res.json();

    return {
      name: data.first_name + ' ' + data.last_name,
      username: data.username,
      id: data.username,
    };
  }

  async voices(apiKey: string) {
    const {
      data: { voices },
    } = await (
      await fetch('https://api.heygen.com/v2/voices', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-api-key': apiKey,
        },
      })
    ).json();

    return voices.slice(0, 20);
  }

  async avatars(apiKey: string) {
    const {
      data: { avatar_group_list },
    } = await (
      await fetch(
        'https://api.heygen.com/v2/avatar_group.list?include_public=false',
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'x-api-key': apiKey,
          },
        },
      )
    ).json();

    const loadedAvatars: any[] = [];

    for (const avatar of avatar_group_list) {
      const {
        data: { avatar_list },
      } = await (
        await fetch(
          `https://api.heygen.com/v2/avatar_group/${avatar.id}/avatars`,
          {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'x-api-key': apiKey,
            },
          },
        )
      ).json();

      loadedAvatars.push(...avatar_list);
    }

    return loadedAvatars;
  }

  async startVideo(
    apiKey: string,
    data: {
      voice: string;
      avatar: string;
      aspect_ratio: string;
      captions: string;
      selectedVoice: string;
      type: 'talking_photo' | 'avatar';
    },
  ): Promise<string> {
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      body: JSON.stringify({
        caption: data.captions === 'yes',
        video_inputs: [
          {
            ...(data.type === 'avatar'
              ? { character: { type: 'avatar', avatar_id: data.avatar } }
              : { character: { type: 'talking_photo', talking_photo_id: data.avatar } }),
            voice: {
              type: 'text',
              input_text: data.voice,
              voice_id: data.selectedVoice,
            },
          },
        ],
        dimension:
          data.aspect_ratio === 'story'
            ? { width: 720, height: 1280 }
            : { width: 1280, height: 720 },
      }),
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    const json = await response.json() as { data: { video_id: string } };
    return json.data.video_id;
  }

  async checkVideoStatus(
    apiKey: string,
    videoId: string,
  ): Promise<{ status: 'pending' | 'processing' | 'completed' | 'failed'; url?: string }> {
    const response = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-api-key': apiKey,
        },
      },
    );

    const json = await response.json() as { data: { status: string; video_url?: string } };
    const { status, video_url } = json.data;

    if (status === 'completed') return { status: 'completed', url: video_url };
    if (status === 'failed') return { status: 'failed' };
    if (status === 'processing') return { status: 'processing' };
    return { status: 'pending' };
  }

  async sendData(
    apiKey: string,
    data: {
      voice: string;
      avatar: string;
      aspect_ratio: string;
      captions: string;
      selectedVoice: string;
      type: 'talking_photo' | 'avatar';
    },
  ): Promise<string> {
    const videoId = await this.startVideo(apiKey, data);

    while (true) {
      const result = await this.checkVideoStatus(apiKey, videoId);
      if (result.status === 'completed' && result.url) return result.url;
      if (result.status === 'failed') throw new Error('HeyGen video generation failed');
      await timer(3000);
    }
  }
}
