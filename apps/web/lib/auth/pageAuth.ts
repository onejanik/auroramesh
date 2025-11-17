import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getUserFromRequest } from './session';

export const requirePageAuth = async <P extends Record<string, unknown> = Record<string, never>>(
  ctx: GetServerSidePropsContext,
  getProps?: (ctx: GetServerSidePropsContext & { userId: number }) => Promise<GetServerSidePropsResult<P>>
): Promise<GetServerSidePropsResult<P>> => {
  const user = getUserFromRequest(ctx.req);
  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false
      }
    };
  }

  if (getProps) {
    return getProps({ ...ctx, userId: user.id });
  }

  return {
    props: {} as P
  };
};

