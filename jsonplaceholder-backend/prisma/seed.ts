import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clear existing data
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.geo.deleteMany();
  await prisma.address.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users = [
    {
      name: 'Leanne Graham',
      username: 'Bret',
      email: 'Sincere@april.biz',
      password: await bcrypt.hash('password123', 10),
      phone: '1-770-736-8031 x56442',
      website: 'hildegard.org',
      address: {
        street: 'Kulas Light',
        suite: 'Apt. 556',
        city: 'Gwenborough',
        zipcode: '92998-3874',
        geo: {
          lat: '-37.3159',
          lng: '81.1496',
        },
      },
      company: {
        name: 'Romaguera-Crona',
        catchPhrase: 'Multi-layered client-server neural-net',
        bs: 'harness real-time e-markets',
      },
    },
    {
      name: 'Ervin Howell',
      username: 'Antonette',
      email: 'Shanna@melissa.tv',
      password: await bcrypt.hash('password123', 10),
      phone: '010-692-6593 x09125',
      website: 'anastasia.net',
      address: {
        street: 'Victor Plains',
        suite: 'Suite 879',
        city: 'Wisokyburgh',
        zipcode: '90566-7771',
        geo: {
          lat: '-43.9509',
          lng: '-34.4618',
        },
      },
      company: {
        name: 'Deckow-Crist',
        catchPhrase: 'Proactive didactic contingency',
        bs: 'synergize scalable supply-chains',
      },
    },
    {
      name: 'Clementine Bauch',
      username: 'Samantha',
      email: 'Nathan@yesenia.net',
      password: await bcrypt.hash('password123', 10),
      phone: '1-463-123-4447',
      website: 'ramiro.info',
      address: {
        street: 'Douglas Extension',
        suite: 'Suite 847',
        city: 'McKenziehaven',
        zipcode: '59590-4157',
        geo: {
          lat: '-68.6102',
          lng: '-47.0653',
        },
      },
      company: {
        name: 'Romaguera-Jacobson',
        catchPhrase: 'Face to face bifurcated interface',
        bs: 'e-enable strategic applications',
      },
    },
  ];

  for (const userData of users) {
    const { address, company, ...userDetails } = userData;
    const user = await prisma.user.create({
      data: {
        ...userDetails,
        address: {
          create: {
            street: address.street,
            suite: address.suite,
            city: address.city,
            zipcode: address.zipcode,
            geo: {
              create: {
                lat: address.geo.lat,
                lng: address.geo.lng,
              },
            },
          },
        },
        company: {
          create: {
            name: company.name,
            catchPhrase: company.catchPhrase,
            bs: company.bs,
          },
        },
      },
    });
    console.log(`Created user with id: ${user.id}`);

    // Create posts for each user
    for (let i = 1; i <= 3; i++) {
      const post = await prisma.post.create({
        data: {
          title: `Post ${i} by ${user.name}`,
          body: `This is the body of post ${i} by ${user.name}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
          userId: user.id,
        },
      });
      console.log(`Created post with id: ${post.id}`);

      // Create comments for each post
      for (let j = 1; j <= 2; j++) {
        const comment = await prisma.comment.create({
          data: {
            name: `Comment ${j} on post ${i}`,
            email: `commenter${j}@example.com`,
            body: `This is comment ${j} on post ${i}. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`,
            postId: post.id,
            userId: user.id,
          },
        });
        console.log(`Created comment with id: ${comment.id}`);
      }
    }

    // Create todos for each user
    for (let i = 1; i <= 3; i++) {
      const completed = i % 2 === 0; // Every even numbered todo is completed
      const todo = await prisma.todo.create({
        data: {
          title: `Todo ${i} for ${user.name}`,
          completed,
          userId: user.id,
        },
      });
      console.log(`Created todo with id: ${todo.id}`);
    }

    // Create albums for each user
    for (let i = 1; i <= 2; i++) {
      const album = await prisma.album.create({
        data: {
          title: `Album ${i} by ${user.name}`,
          userId: user.id,
        },
      });
      console.log(`Created album with id: ${album.id}`);

      // Create photos for each album
      for (let j = 1; j <= 3; j++) {
        const photo = await prisma.photo.create({
          data: {
            title: `Photo ${j} in album ${i}`,
            url: `https://via.placeholder.com/600/92c952?text=Photo${j}Album${i}User${user.id}`,
            thumbnailUrl: `https://via.placeholder.com/150/92c952?text=Photo${j}Album${i}User${user.id}`,
            albumId: album.id,
          },
        });
        console.log(`Created photo with id: ${photo.id}`);
      }
    }
  }

  console.log('Seeding finished');
}
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch(e => {
      console.error('Error disconnecting from database:', e);
      process.exit(1);
    });
  });
