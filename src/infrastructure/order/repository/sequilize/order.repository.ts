import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total,
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }
  async update(entity: Order): Promise<void> {
    await OrderModel.update({
      total: entity.total,
      items: entity.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity,
      })),
    }, {
      where: {
        id: entity.id
      },
    },
    )
  }
  async find(id: string): Promise<Order> {
    let orderModel;
    let orderItemModel;
    try {
      orderModel = await OrderModel.findOne({
        where: {
          id,
        },
        rejectOnEmpty: true,
      });

      orderItemModel = await OrderItemModel.findAll({
        where: {
          order_id: id,
        },
      });
    } catch (error) {
      throw new Error("Customer not found");
    }
    const items = orderItemModel.map(item => {
      return new OrderItem(
        item.id,
        item.name,
        item.price,
        item.product_id,
        item.quantity
        );
    })
    const order = new Order(id, orderModel.customer_id, items);
    return order;
  }
  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll();
    const orders = Promise.all(orderModels.map(async (orderModels) => {
      const orderItemModel = await OrderItemModel.findAll({
        where: {
          order_id: orderModels.id,
        },
      });
      const items = orderItemModel.map(item => {
        return new OrderItem(
          item.id,
          item.name,
          item.price,
          item.product_id,
          item.quantity
          );
      })
      let order = new Order(orderModels.id, orderModels.customer_id, items);
      return order;
    }));
    return orders;
  }
}
