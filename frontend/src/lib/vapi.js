import Vapi from '@vapi-ai/web';

const vapiPublicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;

const vapi = new Vapi(vapiPublicKey);

export default vapi;
