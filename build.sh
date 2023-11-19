
solc --bin --abi ./contracts/Order.sol --base-path ./contracts --include-path ./node_modules/ --via-ir --optimize -o ./build/order

solc --bin --abi ./contracts/User.sol --base-path ./contracts --include-path ./node_modules/ --via-ir --optimize -o ./build/user