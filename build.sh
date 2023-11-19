rm -rf ./build

solc --bin --abi ./contracts/Order.sol --base-path ./contracts --include-path ./node_modules/ --via-ir --optimize -o ./build/order

abigen --bin=./build/order/Order.bin --abi=./build/order/Order.abi --pkg=order --out=./build/order/order.go


solc --bin --abi ./contracts/User.sol --base-path ./contracts --include-path ./node_modules/ --via-ir --optimize -o ./build/user

abigen --bin=./build/user/User.bin --abi=./build/user/User.abi --pkg=user --out=./build/user/user.go