import torch
import sys

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Wrong parameters!')
        print('Usage: python3 run_mobilenet_v2.py <image_file_path>')
    
    model = torch.hub.load('pytorch/vision:v0.6.0', 'mobilenet_v2', pretrained=True, verbose=False)
    model.eval()

    from PIL import Image
    from torchvision import transforms

    try :
        input_image = Image.open(sys.argv[1]).convert(mode='RGB')
        preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        input_tensor = preprocess(input_image)
        input_batch = input_tensor.unsqueeze(0) # create a mini-batch as expected by the model

        with torch.no_grad():
            output = model(input_batch)
        
        # get probabilities
        probs = torch.nn.functional.softmax(output[0], dim=0)

        # get prediction
        print(torch.argmax(probs).item())
    except:
        print('-1')