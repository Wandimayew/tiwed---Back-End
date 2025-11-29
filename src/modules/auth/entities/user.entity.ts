import { Prisma } from '@prisma/client';

// import { User } from '@prisma/client';

// export type UserEntity = User;

// import { Prisma } from '@prisma/client';

import { User } from '@prisma/client';

export type UserEntity = User;


// select whole user from prisma
// export type UserEntity = Prisma.User;

//select fields
// type UserBasic = Pick<Prisma.User, 'id' | 'email' | 'name'>;
