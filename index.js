require('dotenv').config();
const { VK } = require('vk-io');
const vk = new VK({ token: process.env.TOKEN });

vk.updates.start().then(() => {
    console.log('Bot started');
});

vk.updates.on('message', async (context) => {
    const { items } = await vk.api.messages.getConversationMembers({
        peer_id: context.peerId,
        fields: ['is_owner', 'is_admin'],
    });
    const moderators = items.filter((item) => item.is_admin || item.is_owner);
    const isModerator = moderators.some((item) => item.member_id === context.senderId);
    const creator = moderators.find((item) => item.is_owner);
    if (isModerator) return
    await Promise.allSettled([notifyUser(context), notifyCreator(context, creator)]);
    await vk.api.messages.delete({
        message_ids: context.id,
        delete_for_all: true,
    });
});

async function notifyCreator(context, creator) {
    await vk.api.messages.send({
        user_id: creator.member_id,
        message: `Сообщение было удалено из беседы:`,
        random_id: Math.floor(Math.random() * 100000)
    });
    await vk.api.messages.send({
        user_id: creator.member_id,
        forward_messages: context.id,
        random_id: Math.floor(Math.random() * 100000)
    });
}

async function notifyUser(context) {
    const user = await vk.api.users.get({ user_ids: context.senderId });
    await vk.api.messages.send({
        user_id: context.senderId,
        message: `Привет ${user[0].first_name}, только модераторы могут отправлять сообщения в эту группу. Ваше сообщение:`,
        random_id: Math.floor(Math.random() * 100000)
    });
    await vk.api.messages.send({
        user_id: context.senderId,
        forward_messages: context.id,
        random_id: Math.floor(Math.random() * 100000)
    });
    await vk.api.messages.send({
        user_id: context.senderId,
        message: 'было удаалено и переслано создателю беседы',
        random_id: Math.floor(Math.random() * 100000)
    });
}

process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);